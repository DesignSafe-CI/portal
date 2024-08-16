"""
.. :module:: apps.webhooks.views
   :synopsys: Views to handle Webhooks
"""

import json
import logging

from django.contrib.auth import get_user_model
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.db import transaction
from django.http import HttpResponse, HttpResponseBadRequest
from django.core.exceptions import ObjectDoesNotExist
from django.conf import settings

from requests import HTTPError
from tapipy.errors import BaseTapyException

from designsafe.apps.api.notifications.models import Notification
from designsafe.apps.api.tasks import agave_indexer
from designsafe.apps.api.views import BaseApiView
from designsafe.apps.api.exceptions import ApiException
from designsafe.apps.workspace.api.utils import check_job_for_timeout


logger = logging.getLogger(__name__)

TERMINAL_JOB_STATES = ["FINISHED", "CANCELLED", "FAILED"]


def validate_tapis_job(job_uuid, job_owner, disallowed_states=None):
    """
    Verifies that a job UUID is both visible to the owner and belongs to the owner

    Throws ApiException if the job owner does not match the specified job UUID
    Returns:
        None if the job state is disallowed for notifications
        job_data if the job is validated

    """
    user = get_user_model().objects.get(username=job_owner)
    client = user.tapis_oauth.client
    job_data = client.jobs.getJob(jobUuid=job_uuid)

    # Validate the job UUID against the owner
    if job_data.owner != job_owner:
        logger.error(
            f"Tapis job (owner='{job_data.owner}', status='{job_data.status}) for this event (owner='{job_owner}') is not valid"
        )
        raise ApiException("Unable to find a related valid job for this notification.")

    # Check to see if the job state should generate a notification
    if disallowed_states and job_data.status in disallowed_states:
        return None

    job_data = check_job_for_timeout(job_data)

    return job_data


@method_decorator(csrf_exempt, name="dispatch")
class JobsWebhookView(BaseApiView):
    """
    Dispatches notifications when receiving a POST request from the Tapis
    webhook service.

    """

    def post(self, request, *args, **kwargs):
        """Notifies the user of the job status by instantiating and saving
        a Notification instance.

        If the job is finished, we also index the job and alert the user to the
        URL of the job's location in the data depot.

        Args:
            job (dict): Dictionary containing the webhook data.

        """
        subscription = json.loads(request.body)

        job = json.loads(subscription["event"]["data"])

        try:
            username = job["jobOwner"]
            job_uuid = job["jobUuid"]
            job_status = job["newJobStatus"]
            job_name = job["jobName"]
            job_old_status = job["oldJobStatus"]

            # Do nothing on job status not in portal notification states
            if job_status not in settings.PORTAL_JOB_NOTIFICATION_STATES:
                logger.info(
                    f"Job UUID {job_uuid} for owner {username} entered {job_status} state (no notification sent)"
                )
                return HttpResponse("OK")

            # Do nothing on duplicate job status events
            if job_status == job_old_status:
                return HttpResponse("OK")

            logger.info(f"JOB STATUS CHANGE: UUID={job_uuid} status={job_status}")

            event_data = {
                Notification.EVENT_TYPE: "job",
                Notification.STATUS: Notification.INFO,
                Notification.MESSAGE: f"Job '{job_name}' updated to {job_status}",
                Notification.USER: username,
                Notification.EXTRA: {
                    "name": job_name,
                    "owner": username,
                    "status": job_status,
                    "uuid": job_uuid,
                },
            }

            # get additional job information only after the job has reached a terminal state
            non_terminal_states = list(
                set(settings.PORTAL_JOB_NOTIFICATION_STATES) - set(TERMINAL_JOB_STATES)
            )
            job_details = validate_tapis_job(
                job_uuid, username, disallowed_states=non_terminal_states
            )
            if job_details:
                event_data[Notification.EXTRA][
                    "remoteOutcome"
                ] = job_details.remoteOutcome
                event_data[Notification.EXTRA]["status"] = job_details.status

                agave_indexer.apply_async(
                    kwargs={
                        "username": username,
                        "systemId": job_details.archiveSystemId,
                        "filePath": job_details.archiveSystemDir,
                    },
                    queue="indexing",
                )

            with transaction.atomic():
                Notification.objects.create(**event_data)

            return HttpResponse("OK")

        except (ObjectDoesNotExist, BaseTapyException, ApiException) as exc:
            logger.exception(exc)
            return HttpResponseBadRequest(f"ERROR: {exc}")


@method_decorator(csrf_exempt, name="dispatch")
class InteractiveWebhookView(BaseApiView):
    """
    Dispatches notifications when receiving a POST request from interactive jobs
    """

    def post(self, request, *args, **kwargs):
        """
        Creates a notification with a link to the interactive job event.

        """
        event_type = request.POST.get("event_type", None)
        job_uuid = request.POST.get("job_uuid", None)
        job_owner = request.POST.get("owner", None)
        address = request.POST.get("address", None)
        message = request.POST.get("message", None)

        if not address:
            msg = "Missing required interactive webhook parameter: address"
            logger.error(msg)
            return HttpResponseBadRequest(f"ERROR: {msg}")

        event_data = {
            Notification.EVENT_TYPE: event_type,
            Notification.STATUS: Notification.INFO,
            Notification.USER: job_owner,
            Notification.MESSAGE: "Ready to view.",
            Notification.ACTION_LINK: address,
        }

        if message:
            event_data[Notification.MESSAGE] = message

        # confirm that there is a corresponding running tapis job before sending notification
        try:
            valid_state = validate_tapis_job(job_uuid, job_owner, TERMINAL_JOB_STATES)
            if not valid_state:
                raise ApiException(
                    f"Interactive Job UUID {job_uuid} for user {job_owner} was in invalid state"
                )
            event_data[Notification.EXTRA] = {
                "name": valid_state.name,
                "status": valid_state.status,
                "uuid": valid_state.uuid,
            }

        except (HTTPError, BaseTapyException, ApiException) as exc:
            logger.exception(exc)
            return HttpResponseBadRequest(f"ERROR: {exc}")

        Notification.objects.create(**event_data)

        return HttpResponse("OK")

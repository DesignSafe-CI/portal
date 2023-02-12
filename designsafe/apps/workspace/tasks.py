

import os
import json
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.exceptions import ObjectDoesNotExist
from django.urls import reverse
from designsafe.apps.api.agave import impersonate_service_account
from designsafe.apps.api.notifications.models import Notification
from django.db import transaction
from agavepy.agave import AgaveException
from celery import shared_task
from requests import ConnectionError, HTTPError
import logging

from designsafe.apps.data.tasks import agave_indexer

logger = logging.getLogger(__name__)

class JobSubmitError(Exception):

    def __init__(self, *args, **kwargs):
        self.status = kwargs.pop('status', 'error')
        self.status_code = kwargs.pop('status_code', 500)
        self.message = kwargs.pop('message', None)

    def json(self):
        return {
            'status': getattr(self, 'status', 'error'),
            'message': getattr(self, 'message', None)
        }


def submit_job(request, username, job_post):
    """Submits a job using the Agave API, using job parameters defined in
    job_post

    Args:
        request: Django request object.
        username (string): Username of a designsafe user.
        job_post (dict): Job parameters to submit through Agave.

    TODO: Document exactly how the job_post should be set up.

    """
    logger.info('Submitting job for user=%s: %s' % (username, job_post))

    try:
        use_sandbox = getattr(settings, 'AGAVE_USE_SANDBOX', False)
        logger.info('Using Sandbox: %s', use_sandbox)
        if use_sandbox:
            agave = impersonate_service_account(username)
        else:
            user = get_user_model().objects.get(username=username)
            agave = user.agave_oauth.client
        response = agave.jobs.submit(body=job_post)
        logger.debug('Job Submission Response: {}'.format(response))

        return response

    except ConnectionError as e:
        logger.exception(
            'ConnectionError while submitting job: %s',
            e,
            extra={'job': job_post}
        )
        raise JobSubmitError(status='error',
                             status_code=500,
                             message='We were unable to submit your job at this time due '
                                     'to a Job Service Interruption. Please try again later.')

    except HTTPError as e:
        logger.exception(
            'HTTPError while submitting job: %s\n%s',
            e,
            e.response.content,
            extra={'job': job_post}
        )
        if e.response.status_code >= 500:
            raise JobSubmitError(
                status='error',
                status_code=e.response.status_code,
                message='We were unable to submit your job at this time due '
                        'to a Job Service Interruption. Please try again later.')

        err_resp = e.response.json()
        err_resp['status_code'] = e.response.status_code
        logger.warning(err_resp)
        raise JobSubmitError(**err_resp)


def handle_webhook_request(job):
    """Notifies the user of the job status by instantiating and saving
    a Notification instance.

    If the job is finished, we also index the job and  alert the user to the
    URL of the job's location in the data depot.

    Args:
        job (dict): Dictionary containing the webhook data.

    """
    # logger.debug(job)
    try:
        username = job['owner']
        job_id = job['id']

        user = get_user_model().objects.get(username=username)
        ag = user.agave_oauth.client
        # ag_job = ag.jobs.get(jobId=job_id)

        try:
            job['remoteSubmitted'] = str(job['remoteSubmitted'])
            job['ended'] = str(job['ended'])
        except KeyError as e:
            pass

        job_status = job['status']
        job_name = job['name']
        # logger.debug(current_status)
        logger.debug(job_status)
        event_data = {
            Notification.EVENT_TYPE: 'job',
            Notification.JOB_ID: job_id,
            Notification.STATUS: '',
            Notification.USER: username,
            Notification.MESSAGE: '',
            Notification.EXTRA: job
        }
        archive_id = 'agave/%s/%s' % (job['archiveSystem'], job['archivePath'].split('/'))

        if job_status == 'FAILED':
            logger.debug('JOB FAILED: id=%s status=%s' % (job_id, job_status))
            event_data[Notification.STATUS] = Notification.ERROR
            event_data[Notification.MESSAGE] = "Job '%s' Failed. Please try again..." % (job_name)
            event_data[Notification.OPERATION] = 'job_failed'

            last_notification = Notification.objects.filter(jobId=job_id).last()
            should_notify = True

            if last_notification:
                last_status = last_notification.to_dict()['extra']['status']
                logger.debug('last status: ' + last_status)

                if job_status == last_status:
                    logger.debug('duplicate notification received.')
                    should_notify = False

            if should_notify:
                n = Notification.objects.create(**event_data)
                n.save()

        elif job_status == 'FINISHED':
            logger.debug('JOB STATUS CHANGE: id=%s status=%s' % (job_id, job_status))


            logger.debug('archivePath: {}'.format(job['archivePath']))
            target_path = reverse('designsafe_data:data_depot')
            os.path.join(target_path, 'agave', archive_id.strip('/'))
            event_data[Notification.STATUS] = Notification.SUCCESS
            event_data[Notification.EXTRA]['job_status'] = 'FINISHED'
            event_data[Notification.EXTRA]['target_path'] = target_path
            event_data[Notification.MESSAGE] = "Job '%s' finished!" % (job_name)
            event_data[Notification.OPERATION] = 'job_finished'


            last_notification = Notification.objects.filter(jobId=job_id).last()
            should_notify = True

            if last_notification:
                last_status = last_notification.to_dict()['extra']['status']
                logger.debug('last status: ' + last_status)

                if job_status == last_status:
                    logger.debug('duplicate notification received.')
                    should_notify = False

            if should_notify:
                n = Notification.objects.create(**event_data)
                n.save()
                logger.debug('Event data with action link %s' % event_data)

                try:
                    logger.debug('Preparing to Index Job Output job=%s', job_name)

                    archivePath = '/'.join([job['archiveSystem'], job['archivePath']])
                    agave_indexer.apply_async(kwargs={'username': 'ds_admin', 'systemId': job['archiveSystem'], 'filePath': job['archivePath'], 'recurse':True}, queue='indexing')
                    logger.debug('Finished Indexing Job Output job=%s', job_name)
                except Exception as e:
                    logger.exception('Error indexing job output')

        else:
            # notify
            logger.debug('JOB STATUS CHANGE: id=%s status=%s' % (job_id, job_status))
            event_data[Notification.STATUS] = Notification.INFO
            event_data[Notification.MESSAGE] = "Job '%s' updated to %s." % (job_name, job_status)
            event_data[Notification.OPERATION] = 'job_status_update'


            last_notification = Notification.objects.filter(jobId=job_id).last()

            should_notify = True

            if last_notification:
                last_status = last_notification.to_dict()['extra']['status']
                logger.debug('last status: ' + last_status)

                if job_status == last_status:
                    logger.debug('duplicate notification received.')
                    should_notify = False

            if should_notify:
                n = Notification.objects.create(**event_data)
                n.save()

                logger.debug(n.pk)

    except ObjectDoesNotExist:
        logger.exception('Unable to locate local user account: %s' % username)

    except HTTPError as e:
        if e.response.status_code == 404:
            logger.warning('Job not found. Cancelling job watch.',
                        extra={'job_id': job_id})
        else:
            logger.warning('Agave API error. Retrying...')

    except AgaveException as e:
        logger.warning('Agave API error. Retrying...')

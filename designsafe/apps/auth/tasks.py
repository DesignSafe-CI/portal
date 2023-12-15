from datetime import datetime, timedelta
from django.conf import settings
from django.core.mail import send_mail
from agavepy.agave import Agave, AgaveException
from designsafe.apps.api.tasks import agave_indexer
from designsafe.apps.api.notifications.models import Notification
from celery import shared_task
from django.contrib.auth import get_user_model
from pytas.http import TASClient

from requests import HTTPError
from django.contrib.auth import get_user_model
import logging


logger = logging.getLogger(__name__)


@shared_task(default_retry_delay=30, max_retries=3)
def check_or_create_agave_home_dir(username, systemId):
    try:
        # TODO should use OS calls to create directory.
        logger.info(
            "Checking home directory for user=%s on "
            "default storage systemId=%s",
            username,
            systemId
        )
        ag = Agave(api_server=settings.AGAVE_TENANT_BASEURL,
                   token=settings.AGAVE_SUPER_TOKEN)
        try:
            listing_response = ag.files.list(
                systemId=systemId,
                filePath=username)
            logger.info('check home dir response: {}'.format(listing_response))

        except HTTPError as e:
            if e.response.status_code == 404:
                logger.info("Creating the home directory for user=%s then going to run setfacl", username)
                body = {'action': 'mkdir', 'path': username}
                fm_response = ag.files.manage(systemId=systemId,
                                              filePath='',
                                              body=body)
                logger.info('mkdir response: {}'.format(fm_response))

                ds_admin_client = Agave(
                    api_server=getattr(
                        settings,
                        'AGAVE_TENANT_BASEURL'
                    ),
                    token=getattr(
                        settings,
                        'AGAVE_SUPER_TOKEN'
                    ),
                )

                if systemId == settings.AGAVE_STORAGE_SYSTEM:
                    job_body = {
                        'parameters': {
                            'username': username,
                            'directory': 'shared/{}'.format(username)
                        },
                        'name': f'setfacl mydata for user {username}',
                        'appId': 'setfacl_corral3-0.1'
                    }
                elif systemId == settings.AGAVE_WORKING_SYSTEM:
                    job_body = {
                        'parameters': {
                            'username': username,
                        },
                        'name': f'setfacl work for user {username}',
                        'appId': 'setfacl_frontera_work-0.1'
                    }
                else:
                    logger.error('Attempting to set permissions on unsupported system: {}'.format(systemId))
                    return

                jobs_response = ds_admin_client.jobs.submit(body=job_body)
                logger.info('setfacl response: {}'.format(jobs_response))

                # add dir to index
                logger.info("Indexing the home directory for user=%s", username)
                agave_indexer.apply_async(kwargs={'username': username, 'systemId': systemId, 'filePath': username}, queue='indexing')

    except AgaveException:
        logger.exception('Failed to create home directory.',
                         extra={'user': username,
                                'systemId': systemId})


@shared_task(default_retry_delay=30, max_retries=3)
def new_user_alert(username):
    user = get_user_model().objects.get(username=username)
    send_mail('New User in DesignSafe, need Slack', 'Username: ' + user.username + '\n' +
                                                    'Email: ' + user.email + '\n' +
                                                    'Name: ' + user.first_name + ' ' + user.last_name + '\n' +
                                                    'Id: ' + str(user.id) + '\n',
              settings.DEFAULT_FROM_EMAIL, settings.NEW_ACCOUNT_ALERT_EMAILS.split(','),)


@shared_task()
def clear_old_notifications():
    """Delete notifications older than 30 days to prevent them cluttering the db."""
    time_cutoff = datetime.now() - timedelta(days=30)
    Notification.objects.filter(datetime__lte=time_cutoff).delete()


@shared_task(bind=True, max_retries=3)
def update_institution_from_tas(self, username):
    user_model = get_user_model().objects.get(username=username)
    try:
        tas_model = TASClient().get_user(username=username)
    except Exception as exc:
        raise self.retry(exc=exc)
    user_model.profile.institution = tas_model.get('institution', None)
    user_model.profile.save()

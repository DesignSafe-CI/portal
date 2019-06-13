from django.conf import settings
from django.core.mail import send_mail
from agavepy.agave import Agave, AgaveException
from designsafe.apps.api.data.agave.filemanager import FileManager
from celery import shared_task

from requests import HTTPError
from django.contrib.auth import get_user_model 
import logging


logger = logging.getLogger(__name__)


@shared_task(default_retry_delay=1*30, max_retries=3)
def check_or_create_agave_home_dir(username):
    try:
        # TODO should use OS calls to create directory.
        user = get_user_model().objects.get(username=username)
        logger.info(
            "Checking home directory for user=%s on "
            "default storage systemId=%s",
            username,
            settings.AGAVE_STORAGE_SYSTEM
        )
        ag = Agave(api_server=settings.AGAVE_TENANT_BASEURL,
                   token=settings.AGAVE_SUPER_TOKEN)
        try:
            listing_response = ag.files.list(
                systemId=settings.AGAVE_STORAGE_SYSTEM,
                filePath=username)
            logger.info('Check home dir response: {}'.format(listing_response))
                
        except HTTPError as e:
            if e.response.status_code == 404:
                logger.info("Creating the home directory for user=%s then going to run setfacl", username)
                body = {'action': 'mkdir', 'path': username}
                fm_response = ag.files.manage(systemId=settings.AGAVE_STORAGE_SYSTEM, 
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
                job_body = {
                    'inputs': {
                        'username': username,
                        'directory': 'shared/{}'.format(username)
                    },
                    'name': 'setfacl',
                    'appId': 'setfacl_corral3-0.1'
                }
                jobs_response = ds_admin_client.jobs.submit(body=job_body)
                logger.info('setfacl response: {}'.format(jobs_response))

                try:   
                    logger.info("Indexing the home directory for user=%s", username)
                    fm = FileManager(user)
                    fm.indexer.index(
                        settings.AGAVE_STORAGE_SYSTEM,
                        username, username,
                        levels=1
                    )
                except Exception as e:
                    logger.info("Error indexing the home directory for user= %s: %s", username, str(e))

    except(AgaveException):
    #except (HTTPError, AgaveException):
        logger.exception('Failed to create home directory.',
                         extra={'user': username,
                                'systemId': settings.AGAVE_STORAGE_SYSTEM})


@shared_task(default_retry_delay=1*30, max_retries=3)
def new_user_alert(username):
    user = get_user_model().objects.get(username=username)
    send_mail('New User in DesignSafe, need Slack', 'Username: ' + user.username + '\n' + 
                                                    'Email: ' + user.email + '\n' +
                                                    'Name: ' + user.first_name + ' ' + user.last_name + '\n' + 
                                                    'Id: ' + str(user.id) + '\n',
              settings.DEFAULT_FROM_EMAIL, [settings.NEW_ACCOUNT_ALERT_EMAIL],)    

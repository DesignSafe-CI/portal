from django.conf import settings
from django.core.mail import send_mail
from agavepy.agave import Agave, AgaveException
from designsafe.apps.data.tasks import reindex_agave
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
            resp = ag.files.list(
                systemId=settings.AGAVE_STORAGE_SYSTEM,
                filePath=username)
            logger.info('check home dir response: {}'.format(resp))
                
        except HTTPError as e:
            if e.response.status_code == 404:
                logger.info("creating the home directory for user=%s then going to run setfacl", username)
                body = {'action': 'mkdir', 'path': username}
                response1 = ag.files.manage(systemId=settings.AGAVE_STORAGE_SYSTEM, 
                                filePath='', 
                                body=body)
                logger.info('mkdir response: {}'.format(response1))

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
                response = ds_admin_client.jobs.submit(body=job_body)
                logger.info('setfacl response: {}'.format(response))

                # add dir to index

                reindex_agave.apply_async(kwargs={
                                      'username': username,
                                      'file_id': '{}/'.format(settings.AGAVE_STORAGE_SYSTEM)
                                      },
                                      queue='indexing')
                #fm = FileManager(user)
                #fm.indexer.index(
                #    settings.AGAVE_STORAGE_SYSTEM,
                #    username, username,
                #    levels=1
                #)

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

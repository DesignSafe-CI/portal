from datetime import datetime, timedelta
import requests
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.exceptions import ObjectDoesNotExist
from django.core.mail import send_mail
from designsafe.apps.api.agave import get_service_account_client, get_tg458981_client
from designsafe.apps.api.tasks import agave_indexer
from designsafe.apps.api.notifications.models import Notification
from celery import shared_task
from django.contrib.auth import get_user_model
from pytas.http import TASClient
from tapipy.errors import NotFoundError, BaseTapyException
from designsafe.utils.system_access import register_public_key, create_system_credentials
from designsafe.utils.encryption import createKeyPair
from django.contrib.auth import get_user_model
import logging


logger = logging.getLogger(__name__)


def get_systems_to_configure(username):
    """ Get systems to configure either during startup or for new user """

    systems = []
    for system in settings.TAPIS_SYSTEMS_TO_CONFIGURE:
        system_copy = system.copy()
        system_copy['path'] = system_copy['path'].format(username=username)
        systems.append(system_copy)
    return systems


@shared_task(default_retry_delay=30, max_retries=3, queue='onboarding')
def check_or_configure_system_and_user_directory(username, system_id, path, create_path):
    try:
        user_client = get_user_model().objects.get(username=username).tapis_oauth.client
        user_client.files.listFiles(
            systemId=system_id, path=path
        )
        logger.info(f"System Works: "
                    f"Checked and there is no need to configure system:{system_id} path:{path} for {username}")
        return
    except ObjectDoesNotExist:
        # User is missing; handling email confirmation process where user has not logged in
        logger.info(f"New User: "
                    f"Checked and there is a need to configure system:{system_id} path:{path} for {username} ")
    except BaseTapyException as e:
        logger.info(f"Unable to list system/files: "
                    f"Checked and there is a need to configure system:{system_id} path:{path} for {username}: {e}")

    try:
        if create_path:
            tg458981_client = get_tg458981_client()
            try:
                # User tg account to check if path exists
                tg458981_client.files.listFiles(systemId=system_id, path=path)
                logger.info(f"Directory for user={username} on system={system_id}/{path} exists and works. ")
            except NotFoundError:
                logger.info("Creating the directory for user=%s then going to run setfacl on system=%s path=%s",
                            username,
                            system_id,
                            path)

                tg458981_client.files.mkdir(systemId=system_id, path=path)
                tg458981_client.files.setFacl(
                    systemId=system_id,
                    path=path,
                    operation="ADD",
                    recursionMethod="PHYSICAL",
                    aclString=f"d:u:{username}:rwX,u:{username}:rwX,d:u:tg458981:rwX,u:tg458981:rwX,d:o::---,o::---,d:m::rwX,m::rwX",
                )
                agave_indexer.apply_async(
                    kwargs={"systemId": system_id, "filePath": path, "recurse": False},
                    queue="indexing",
                )

        # create keys, push to key service and use as credential for Tapis system
        logger.info("Creating credentials for user=%s on system=%s", username, system_id)
        (private_key, public_key) = createKeyPair()
        register_public_key(username, public_key, system_id)
        service_account = get_service_account_client()
        create_system_credentials(service_account,
                                  username,
                                  public_key,
                                  private_key,
                                  system_id)
    except BaseTapyException as exc:
        logger.exception('Failed to configure system (i.e. create directory, set acl, create credentials).',
                         extra={'user': username,
                                'systemId': system_id,
                                'path': path})
        raise check_or_configure_system_and_user_directory.retry(exc=exc)


@shared_task(default_retry_delay=30, max_retries=3)
def new_user_alert(username):
    user = get_user_model().objects.get(username=username)
    send_mail('New User in DesignSafe, need Slack', 'Username: ' + user.username + '\n' +
                                                    'Email: ' + user.email + '\n' +
                                                    'Name: ' + user.first_name + ' ' + user.last_name + '\n' +
                                                    'Id: ' + str(user.id) + '\n',
              settings.DEFAULT_FROM_EMAIL, settings.NEW_ACCOUNT_ALERT_EMAILS.split(','),)

    tram_headers = {"tram-services-key": settings.TRAM_SERVICES_KEY}
    tram_body = {"project_id": settings.TRAM_PROJECT_ID,
                 "email": user.email}
    tram_resp = requests.post(f"{settings.TRAM_SERVICES_URL}/project_invitations/create",
                                 headers=tram_headers,
                                 json=tram_body,
                                 timeout=15)
    tram_resp.raise_for_status()


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

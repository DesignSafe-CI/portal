from celery import task
from django.conf import settings
from boxsdk import OAuth2, Client
from boxsdk.exception import BoxAPIException
from models import BoxUserToken
import logging


logger = logging.getLogger(__name__)


@task
def check_connection(user):
    try:
        token = BoxUserToken.objects.get(user=user)
        oauth = OAuth2(
            client_id=settings.BOX_APP_CLIENT_ID,
            client_secret=settings.BOX_APP_CLIENT_SECRET,
            access_token=token.access_token,
            refresh_token=token.refresh_token,
            store_tokens=token.update_tokens
        )
        client = Client(oauth)
        try:
            box_user = client.user(user_id='me').get()
            return box_user
        except BoxAPIException:
            logger.exception('Box.com connection failed')
    except BoxUserToken.DoesNotExist as e:
        logger.exception(e)


@task
def check_or_create_sync_folder(user):
    try:
        token = BoxUserToken.objects.get(user=user)
        oauth = OAuth2(
            client_id=settings.BOX_APP_CLIENT_ID,
            client_secret=settings.BOX_APP_CLIENT_SECRET,
            access_token=token.access_token,
            refresh_token=token.refresh_token,
            store_tokens=token.update_tokens
        )
        client = Client(oauth)
        try:
            client.folder(folder_id=0).create_subfolder(settings.BOX_SYNC_FOLDER_NAME)
        except BoxAPIException as e:
            logger.debug(e)
            if e.code == 'item_name_in_use':
                logger.debug(
                    'Box sync folder "%s" already exists' % settings.BOX_SYNC_FOLDER_NAME)
            else:
                logger.exception('Unable to create sync folder')
    except BoxUserToken.DoesNotExist:
        logger.exception('Box.com not enabled for user=%s' % user.username)

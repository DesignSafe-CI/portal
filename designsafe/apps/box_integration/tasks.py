from celery import shared_task
from django.conf import settings
from django.contrib.auth import get_user_model
from boxsdk import OAuth2, Client
from boxsdk.exception import BoxAPIException
from models import BoxUserToken
import logging


logger = logging.getLogger(__name__)


def check_connection(username):
    """
    Checks if the user's Box.com connection is working.
    Args:
        username: The username of the User to connection test

    Returns:
        The remote Box.com user record as a dict

    Raises:
        BoxOAuthException: if authentication failed or if token failed to refresh
        BoxException: if other boxsdk errors
        BoxUserToken.DoesNotExist: if token does not exist for user
    """
    user = get_user_model().objects.get(username=username)
    token = BoxUserToken.objects.get(user=user)
    oauth = OAuth2(
        client_id=settings.BOX_APP_CLIENT_ID,
        client_secret=settings.BOX_APP_CLIENT_SECRET,
        access_token=token.access_token,
        refresh_token=token.refresh_token,
        store_tokens=token.update_tokens
    )
    client = Client(oauth)
    box_user = client.user(user_id='me').get()
    return box_user


@shared_task
def check_or_create_sync_folder(username):
    """

    Args:
        username:

    Returns:

    """
    try:
        user = get_user_model().objects.get(username=username)
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

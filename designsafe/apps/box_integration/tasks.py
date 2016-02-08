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
    Check if a sync folder named according to settings.BOX_SYNC_FOLDER_NAME exists in
    the user's Box account, and creates one if not.

    Args:
        username: the username to create a sync folder for

    Returns:
        None

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


@shared_task
def handle_box_webhook_event(event):
    """
    Async handler for box_webhook events.

    Args:
        event: the event object received from box.

    Returns:
        None

    """
    box_user_id = event.from_user_id
    try:
        box_user_token = BoxUserToken.objects.get(box_user_id=box_user_id)
        logger.info('Received Box event for user=%s. %s' %
                    (box_user_token.user.username, event))
        agent = BoxSyncAgent(box_user_token)
        agent.handle_box_event(event)
    except BoxUserToken.DoesNotExist:
        logger.exception('BoxUserToken not found for box_user_id=%s; '
                         'unable to handle event %s' % (box_user_id, event))


class BoxSyncAgent(object):

    def __init__(self, token):
        self._token = token
        self._oauth = OAuth2(
            client_id=settings.BOX_APP_CLIENT_ID,
            client_secret=settings.BOX_APP_CLIENT_SECRET,
            access_token=self._token.access_token,
            refresh_token=self._token.refresh_token,
            store_tokens=self._token.update_tokens
        )
        self.client = Client(self._oauth)

    def handle_box_event(self, event):
        if event.event_type == 'created':
            self.handle_new_item_event(event)
        if event.event_type == 'uploaded':
            self.handle_new_item_event(event)
        if event.event_type == 'copied':
            self.handle_new_item_event(event)
        if event.event_type == 'deleted':
            self.handle_rm_item_event(event)
        if event.event_type == 'moved':
            self.handle_move_item_event(event)

    def _get_event_item(self, event):
        if event.item_type == 'file':
            item = self.client.file(file_id=event.item_id)
        else:
            item = self.client.folder(folder_id=event.item_id)
        return item.get()

    def handle_new_item_event(self, event):
        item = self._get_event_item(event)
        if self.check_item_in_sync_path(item):
            path = self.get_item_path(item)
            logger.debug('Create item %s at path %s' % (item.name, path))
            pass

    def handle_rm_item_event(self, event):
        parent_folder_id = event.parent_folder_id
        folder = self.client.folder(folder_id=parent_folder_id).get()
        if self.check_item_in_sync_path(folder):
            path = self.get_item_path(folder)
            path += '/%s' % folder.name
            logger.debug('Deleted item %s from path %s' % (event.item_name, path))

    def handle_move_item_event(self, event):
        item = self._get_event_item(event)
        if self.check_item_in_sync_path(item):
            path = self.get_item_path(item)
            logger.debug('Moved item %s to path %s' % (event.item_name, path))

    def check_item_in_sync_path(self, item):
        sync_folder = next((p for p in item.path_collection['entries']
                            if p['name'] == settings.BOX_SYNC_FOLDER_NAME), None)
        return sync_folder is not None

    def get_item_path(self, item):
        return '/'.join([p['name'] for p in item.path_collection['entries']])

    def check_known_item(self, item):
        pass

from agavepy.agave import Agave, AgaveException
from celery import shared_task
from django.conf import settings
from django.contrib.auth import get_user_model
from boxsdk import OAuth2, Client
from boxsdk.exception import BoxAPIException, BoxException
from .models import BoxUserToken
import logging
import six
import json


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
def check_or_create_box_sync_folder(username):
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
        logger.exception('Box.com not enabled for user=%s' % username)


@shared_task
def check_or_create_agave_sync_folder(username):
    logger.info(
        "Checking BoxSync directory for user=%s on BoxSync storage systemId=%s" %
        (username, settings.BOX_SYNC_AGAVE_SYSTEM))
    try:
        ag = Agave(api_server=settings.AGAVE_TENANT_BASEURL,
                   token=settings.AGAVE_SUPER_TOKEN)
        body = {'action': 'mkdir', 'path': username}
        ag.files.manage(systemId=settings.BOX_SYNC_AGAVE_SYSTEM,
                        filePath='/',
                        body=json.dumps(body))
    except AgaveException:
        logger.exception('Failed to create home directory for user=%s' % username)


@shared_task
def handle_box_webhook_event(event_data):
    """
    Async handler for box_webhook events.
    The event_data.to_user_ids is a list of box user_ids who have added
    the DesignSafe-CI Box Sync app. We just need to have one of these in
    order to query for the item to 1) determine if the item is in the watched
    sync path and 2) get the item ownership. The item's owner is who we will
    sync the item for in DesignSafe-CI.
    Args:
        event_data: the event object received from box.
    Returns:
        None
    """
    logger.info('Received Box webhook event %s' % event_data)
    event = BoxWebhookEvent(event_data)
    try:
        tokens = BoxUserToken.objects.filter(box_user_id__in=event_data.to_user_ids)
        for token in tokens:
            agent = BoxSyncAgent(token)
            item = agent.get_event_item(event)
            if item.owned_by['id'] == token.box_user_id:
                break
        agent.handle_box_event(event)
    except BoxUserToken.DoesNotExist:
        logger.exception('BoxUserToken not found for box_user_ids=%s; '
                         'unable to handle event %s' % (event_data.to_user_ids, event))


class BoxWebhookEvent(object):

    def __init__(self, event_data=None, **kwargs):
        if event_data is not None:
            for k, v in six.iteritems(event_data):
                setattr(self, k, v)
        for k, v in six.iteritems(kwargs):
            setattr(self, k, v)

    def __str__(self):
        return unicode(self).encode('utf-8')

    def __unicode__(self):
        return u'BoxWebhookEvent[event_type="%s" item_type="%s" item_id="%s"]' % (
            getattr(self, 'event_type', None),
            getattr(self, 'item_type', None),
            getattr(self, 'item_id', None)
        )


class BoxWebhookEvent(object):

    def __init__(self, event_data=None, **kwargs):
        if event_data is not None:
            for k, v in six.iteritems(event_data):
                setattr(self, k, v)
        for k, v in six.iteritems(kwargs):
            setattr(self, k, v)

    def __str__(self):
        return unicode(self).encode('utf-8')

    def __unicode__(self):
        return u'BoxWebhookEvent[event_type="%s" item_type="%s" item_id="%s"]' % (
            getattr(self, 'event_type', None),
            getattr(self, 'item_type', None),
            getattr(self, 'item_id', None)
        )


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
        try:
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
        except BoxException:
            logger.exception('Unable to handle event: %s' % event)

    def get_event_item(self, event):
        if event.item_type == 'file':
            item = self.client.file(file_id=event.item_id)
        else:
            item = self.client.folder(folder_id=event.item_id)
        return item.get()

    def handle_new_item_event(self, event):
        item = self.get_event_item(event)
        if self.check_item_in_sync_path(item):
            path = self.get_item_path(item)
            logger.debug('Create item %s at path %s' % (item.name, path))


    def handle_rm_item_event(self, event):
        parent_folder_id = event.parent_folder_id
        folder = self.client.folder(folder_id=parent_folder_id).get()
        if self.check_item_in_sync_path(folder):
            path = self.get_item_path(folder)
            path += '/%s' % folder.name
            logger.debug('Deleted item %s from path %s' % (event.item_name, path))

    def handle_move_item_event(self, event):
        item = self.get_event_item(event)
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

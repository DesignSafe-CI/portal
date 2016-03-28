from agavepy.agave import Agave, AgaveException
from agavepy.async import AgaveAsyncResponse, TimeoutError, Error
from celery import shared_task
from django.conf import settings
from django.contrib.auth import get_user_model
from boxsdk import Client
from dsapi.agave.daos import AgaveFolderFile, FileManager
from boxsdk.exception import BoxAPIException, BoxException
from designsafe.libs.elasticsearch.api import Object
from designsafe.apps.box_integration import util
from designsafe.apps.box_integration.models import BoxUserToken
import logging
import requests
from requests.exceptions import HTTPError

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
    client = Client(util.get_box_oauth(token))
    box_user = client.user(user_id=u'me').get()
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
        client = Client(util.get_box_oauth(token))
        try:
            client.folder(folder_id=u'0').create_subfolder(settings.BOX_SYNC_FOLDER_NAME)
        except BoxAPIException as e:
            logger.debug(e)
            if e.code == 'item_name_in_use':
                logger.debug(
                    'Box sync folder "%s" already exists' % settings.BOX_SYNC_FOLDER_NAME)
            else:
                logger.exception('Unable to create sync folder')
    except BoxUserToken.DoesNotExist:
        logger.warning('Box.com not enabled for user=%s' % username)


@shared_task
def check_or_create_agave_sync_folder(username):
    logger.info(
        "Checking BoxSync directory for user=%s on BoxSync storage systemId=%s" %
        (username, settings.BOX_SYNC_AGAVE_SYSTEM))
    sync_dir_name = '%s/%s' % (username, settings.BOX_SYNC_FOLDER_NAME)

    sync_dir = None
    ag = Agave(api_server=settings.AGAVE_TENANT_BASEURL,
               token=settings.AGAVE_SUPER_TOKEN)
    try:
        sync_dir = AgaveFolderFile.from_path(ag, settings.BOX_SYNC_AGAVE_SYSTEM,
                                             sync_dir_name)
        o = Object().get_exact_path(system_id=settings.BOX_SYNC_AGAVE_SYSTEM,
                                    username=username, path=sync_dir.path,
                                    name=sync_dir.name)
        if o is None:
            o = Object()
        o.update_from_dict(**sync_dir)
        o.save()
    except HTTPError:
        pass

    if sync_dir is None:
        try:
            fm = FileManager(agave_client=ag)
            fm.mkdir(path=username, new=settings.BOX_SYNC_FOLDER_NAME,
                     system_id=settings.BOX_SYNC_AGAVE_SYSTEM, username=username)
        except HTTPError:
            logger.exception('Failed to create BoxSync directory for user',
                             extra={'username': username})


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
    event = BoxWebhookEvent(event_data)
    try:
        owner_box_user_id = event.get_owner_box_user_id()
        box_token = BoxUserToken.objects.get(box_user_id=owner_box_user_id)
        box_client = Client(util.get_box_oauth(box_token))
        agave_token = box_token.user.agave_oauth
        if agave_token.expired:
            agave_token.refresh()
        agave_client = Agave(api_server=settings.AGAVE_TENANT_BASEURL,
                             token=agave_token.access_token)

        logger.info('Received BoxWebhookEvent=%s for User=%s' % (event, box_token.user))
        agent = BoxSyncAgent(box_token.user, box_client, agave_client)
        agent.handle_box_event(event)
    except BoxUserToken.DoesNotExist:
        logger.warning('BoxUserToken not found for box_user_ids=%s; '
                       'unable to handle event %s' % (event.to_user_ids, event))
    except:
        logger.exception('Unexpected exception handling Box event %s' % event)


class BoxWebhookEvent(object):

    def __init__(self, event_data):
        self.event_type = event_data['event_type']
        self.item_id = event_data['item_id']
        self.item_type = event_data['item_type']
        self.item_name = event_data['item_name']
        self.item_extension = event_data['item_extension']
        self.item_parent_folder_id = event_data['item_parent_folder_id']
        self.from_user_id = event_data['from_user_id']
        self.to_user_ids = event_data['to_user_ids']

    def __str__(self):
        return self.__unicode__().encode('utf-8')

    def __unicode__(self):
        return u'BoxWebhookEvent[event_type="%s" item_type="%s" ' \
               u'item_id="%s" item_name="%s"]' % \
               (self.event_type, self.item_type, self.item_id, self.item_name)

    def get_owner_box_user_id(self):
        tokens = BoxUserToken.objects.filter(box_user_id__in=self.to_user_ids)
        if tokens:
            client = Client(util.get_box_oauth(tokens[0]))
            if self.event_type == 'deleted':
                item = client.folder(self.item_parent_folder_id)
            elif self.item_type == 'file':
                item = client.file(self.item_id)
            else:
                item = client.folder(self.item_id)
            item = item.get()
            return item.owned_by['id']
        return None


class BoxSyncAgent(object):

    def __init__(self, user, box_client, agave_client):
        self.user = user
        self.box_client = box_client
        self.agave_client = agave_client

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
            logger.exception('Unable to handle Box event',
                             extra={'event': event})

    def get_event_item(self, event):
        if event.item_type == 'file':
            item = self.box_client.file(file_id=event.item_id)
        else:
            item = self.box_client.folder(folder_id=event.item_id)
        return item.get()

    def file_download_url(self, box_file):
        """
        Get the File download URL instead of downloading the file.
        Args:
            box_file: a Box File item

        Returns: A URL to download the File content

        """
        content_url = box_file.get_url('content')
        headers = {
            'Authorization': 'Bearer %s' % self.box_client._oauth.access_token
        }
        resp = requests.get(content_url, headers=headers, allow_redirects=False)
        if resp.status_code == 302:
            return resp.headers['Location']

    def ensure_sync_path(self, path_to_item):
        full_path_parts = path_to_item.split('/')
        for i in range(1, len(full_path_parts) + 1):
            sub_path = '/'.join(full_path_parts[:i])
            logger.debug('ensure path exists: %s' % sub_path)
            aff = None
            try:
                aff = AgaveFolderFile.from_path(
                    self.agave_client, settings.BOX_SYNC_AGAVE_SYSTEM, sub_path)
            except HTTPError:
                # mkdir
                parts = full_path_parts[:i]
                new_dir = parts.pop()
                parent_path = '/'.join(parts)
                logger.debug('Create new directory "%s" at path "%s"' % (new_dir,
                                                                         parent_path))
                fm = FileManager(agave_client=self.agave_client)
                fm.mkdir(path=parent_path,
                         new=new_dir,
                         system_id=settings.BOX_SYNC_AGAVE_SYSTEM,
                         username=self.user.username)
                aff = AgaveFolderFile.from_path(
                    self.agave_client, settings.BOX_SYNC_AGAVE_SYSTEM, sub_path)
            except AgaveException:
                logger.exception('Failed to create local path for sync')

            if aff is not None:
                meta = Object().get_exact_path(aff.system, self.user.username,
                                               aff.path, aff.name)
                if meta is None:
                    meta = Object(**aff.to_dict())
                    meta.save()
                else:
                    meta.update_from_dict(**aff.to_dict())

    def download_new_file(self, item, download_url):
        sync_path = util.get_sync_path(item)
        full_path = '%s/%s' % (self.user.username, sync_path)
        file_path = '%s/%s' % (full_path, item.name)
        logger.info('Create item=%s for user=%s at path=%s' %
                    (item.name, self.user, full_path))

        # ensure full sync_path exists
        self.ensure_sync_path(full_path)

        # schedule file import
        try:
            import_resp = self.agave_client.files.importData(
                systemId=settings.BOX_SYNC_AGAVE_SYSTEM,
                filePath=full_path,
                fileName=item.name,
                urlToIngest=download_url)

            # import is async, so wait for status
            # TODO If the transfer takes more than 10 mins, this will fail.
            # TODO If the agave token expires this will fail
            # TODO If the async_resp.result times out, we should queue another check.
            try:
                async_resp = AgaveAsyncResponse(self.agave_client, import_resp)
                async_status = async_resp.result(600)
                if async_status == 'FAILED':
                    logger.error('Box File Transfer failed: %s' % file_path)
                    # TODO notify the user it failed to transfer!
                else:
                    logger.info('Indexing Box File Transfer %s' % file_path)
                    aff = AgaveFolderFile.from_path(
                        self.agave_client, settings.BOX_SYNC_AGAVE_SYSTEM, file_path)
                    meta = Object(**aff.to_dict())
                    meta.save()
            except (TimeoutError, Error):
                logger.error('AsyncResponse Error on Agave.files.importData from Box',
                             extra={
                                 'item': item
                             })
        except HTTPError:
            logger.exception('Agave.files.importData from Box Failed',
                             extra={
                                 'item': item
                             })

    def handle_new_item_event(self, event):
        item = self.get_event_item(event)
        if util.check_item_in_sync_path(item):
            if event.item_type == 'file':
                download_url = self.file_download_url(item)
                if download_url:
                    self.download_new_file(item, download_url)
                else:
                    logger.error('Unable to get download_url for Box item',
                                 extra={'item': item.name,
                                        'user': self.user,
                                        'event': event})
            else:
                sync_path = util.get_sync_path(item)
                item_path = '%s/%s/%s' % (self.user.username, sync_path, item.name)
                self.ensure_sync_path(item_path)

    def handle_rm_item_event(self, event):
        folder = self.box_client.folder(folder_id=event.item_parent_folder_id).get()
        if util.check_item_in_sync_path(folder):
            sync_path = util.get_sync_path(folder)
            parent_path = '%s/%s/%s' % (self.user.username, sync_path, folder.name)
            item_path = '%s/%s' % (parent_path, event.item_name)
            logger.info('Deleting file %s' % item_path)
            fm = FileManager(agave_client=self.agave_client)
            fm.delete(system_id=settings.BOX_SYNC_AGAVE_SYSTEM,
                      path=item_path,
                      username=self.user.username)

    def handle_move_item_event(self, event):
        item = self.get_event_item(event)
        if util.check_item_in_sync_path(item):
            path = util.get_item_path(item)
            # TODO
            logger.info(
                'Moved item=%s for user=%s to path %s' %
                (event.item_name, self.user, path))

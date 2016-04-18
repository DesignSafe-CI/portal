from agavepy.agave import Agave, AgaveException
from agavepy.async import AgaveAsyncResponse, TimeoutError, Error
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.db.utils import IntegrityError
from boxsdk import Client, OAuth2
from dsapi.agave.daos import AgaveFolderFile, FileManager
from boxsdk.exception import BoxAPIException
from designsafe.libs.elasticsearch.api import Object
from designsafe.apps.box_integration.models import BoxUserToken, BoxUserEvent
from designsafe.apps.box_integration import util
from celery import shared_task
from dateutil import parser
from datetime import datetime
import six
import logging
import json
import requests
from requests.exceptions import HTTPError

logger = logging.getLogger(__name__)

TASK_LOCK_EXPIRE = 60 * 10  # lock expires in 10 minutes


def task_acquire_lock(key):
    return cache.add(key, 'true', TASK_LOCK_EXPIRE)


def task_release_lock(key):
    cache.delete(key)


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
def initialize_box_sync(username):
    """
    Create or get Sync folder in user's Box account. Then Create or get Sync folder in
    user's Agave storage system. Create or update box_sync_object metadata for Agave folder.
    """
    user = get_user_model().objects.get(username=username)
    box_oauth = OAuth2(
        client_id=settings.BOX_APP_CLIENT_ID,
        client_secret=settings.BOX_APP_CLIENT_SECRET,
        access_token=user.box_user_token.access_token,
        refresh_token=user.box_user_token.refresh_token,
        store_tokens=user.box_user_token.update_tokens
    )
    box_api = Client(box_oauth)

    if user.agave_oauth.expired:
        user.agave_oauth.refresh()
    agave_api = Agave(api_server=settings.AGAVE_TENANT_BASEURL,
                      token=user.agave_oauth.access_token)

    box_sync_folder = None
    try:
        root_folder = box_api.folder(folder_id=u'0')
        box_sync_folder = root_folder.create_subfolder(settings.BOX_SYNC_FOLDER_NAME)
    except BoxAPIException as e:
        logger.debug(e)
        if e.code == 'item_name_in_use':
            logger.debug(
                'Box sync folder "%s" already exists' % settings.BOX_SYNC_FOLDER_NAME)
            folder_id = e.context_info['conflicts'][0]['id']
            box_sync_folder = box_api.folder(folder_id=folder_id).get()
        else:
            logger.exception('Unable to create sync folder')
    if box_sync_folder is None:
        raise Exception('Failed to create Sync Folder in Box. BoxSync Init Failed.')

    agave_sync_folder = None
    try:
        agave_sync_folder = AgaveFolderFile.from_path(
            agave_client=agave_api,
            system_id=settings.BOX_SYNC_AGAVE_SYSTEM,
            path='%s/%s' % (username, settings.BOX_SYNC_FOLDER_NAME))

        # ensure indexed
        es_agave_sync_folder = Object(**agave_sync_folder.to_dict())
        es_agave_sync_folder.save()
    except HTTPError as e:
        if e.response.status_code == 404:
            fm = FileManager(agave_api)
            es_meta, agave_sync_folder = fm.mkdir(username,
                                                  settings.BOX_SYNC_FOLDER_NAME,
                                                  settings.BOX_SYNC_AGAVE_SYSTEM,
                                                  username)
        else:
            logger.exception('Unable to create sync folder')
    if agave_sync_folder is None:
        raise Exception('Failed to create Sync Folder in Agave. BoxSync Init Failed.')

    # update associated metadata
    add_update_box_metadata(agave_api, agave_sync_folder.uuid, box_sync_folder.object_id)


@shared_task
def handle_box_webhook_event(event_data):
    """
    Async handler for box_webhook events.

    The event_data['to_user_ids'] is a list of box user_ids who have added
    the DesignSafe-CI Box Sync app. For each user being sent the event, we
    schedule a task to process updates to the their box events stream.

    Args:
        event_data: the event object received from box.

    Returns:
        None
    """
    for box_user_id in event_data['to_user_ids']:
        try:
            box_token = BoxUserToken.objects.get(box_user_id=box_user_id)
            logger.debug('Schedule update_box_events_stream for user=%s' %
                         box_token.user.username)
            update_box_events_stream.apply_async(args=(box_token.user.username,))
        except BoxUserToken.DoesNotExist:
            logger.warn('Received Box event for user without BoxUserToken',
                        extra={'box_event': event_data})


@shared_task(bind=True)
def update_box_events_stream(self, username):

    task_lock_id = '{0}-lock-{1}'.format(self.name, username)

    if task_acquire_lock(task_lock_id):
        try:
            user = get_user_model().objects.get(username=username)
            box_oauth = OAuth2(
                client_id=settings.BOX_APP_CLIENT_ID,
                client_secret=settings.BOX_APP_CLIENT_SECRET,
                access_token=user.box_user_token.access_token,
                refresh_token=user.box_user_token.refresh_token,
                store_tokens=user.box_user_token.update_tokens
            )
            box_api = Client(box_oauth)
            last_stream_pos = user.box_stream_pos.stream_position
            events = box_api.events().get_events(stream_position=last_stream_pos,
                                                 stream_type='changes')

            for entry in events['entries']:
                try:
                    persisted = BoxUserEvent()
                    persisted.user = user
                    persisted.event_id = entry['event_id']
                    persisted.event_type = entry['event_type']
                    persisted.created_at = parser.parse(entry['created_at'])
                    persisted.source_dict = entry['source']
                    persisted.from_stream_position = last_stream_pos
                    persisted.save()
                except IntegrityError:
                    logger.info('Event %s already exists for user=%s', entry['event_id'],
                                username)

            user.box_stream_pos.stream_position = events['next_stream_position']
            user.box_stream_pos.save()
        finally:
            task_release_lock(task_lock_id)
    else:
        logger.warn('Box Events Stream already being updated for user=%s', username)

        # schedule another for in the future
        update_box_events_stream.apply_async(args=(username,), countdown=100)


def event_item_in_sync_path(item):
    """
    We are only concerned with events within the DesignSafe-CI-Sync path. All Box items
    are rooted at "All Files". The DesignSafe-CI-Sync events items' path will have the
    path_collection entry index==1 be settings.BOX_SYNC_FOLDER_NAME.

    Args:
        item: The Box Event Item, i.e. event['source']

    Returns: True if the event is for an item in the sync path, False otherwise.

    """
    if len(item['path_collection']['entries']) > 1:
        first_dir = item['path_collection']['entries'][1]
        if first_dir['name'] == settings.BOX_SYNC_FOLDER_NAME:
            return True
    return False


@shared_task(bind=True)
def process_user_events_stream(self, username):
    task_lock_id = '{0}-lock-{1}'.format(self.name, username)

    if task_acquire_lock(task_lock_id):
        try:
            user = get_user_model().objects.get(username=username)
            agent = BoxSyncAgent(user)
            agent.process_events_stream()
        finally:
            task_release_lock(task_lock_id)
    else:
        logger.warn('Box Events Stream already being processed for user=%s', username)

        # reschedule task
        process_user_events_stream.apply_async(args=(username,), countdown=100)


def add_update_box_metadata(agave_api, agave_uuid, box_object_id, **kwargs):
    value = {
        'id': box_object_id
    }
    for k, v in six.iteritems(kwargs):
        value[k] = v

    query = {'name': 'box_sync_object', 'associationId': [agave_uuid]}
    results = agave_api.meta.listMetadata(q=json.dumps(query))
    if results:
        meta = results[0]
        meta['value'] = value
        meta = agave_api.meta.updateMetadata(uuid=meta['uuid'], body=json.dumps(meta))
    else:
        meta = {'name': 'box_sync_object',
                'value': value,
                'associationIds': [agave_uuid]
                }
        meta = agave_api.meta.addMetadata(body=json.dumps(meta))
    return meta


class BoxSyncAgent(object):

    max_events_to_process = 10

    def __init__(self, user):
        self.user = user
        self.box_oauth = OAuth2(
            client_id=settings.BOX_APP_CLIENT_ID,
            client_secret=settings.BOX_APP_CLIENT_SECRET,
            access_token=user.box_user_token.access_token,
            refresh_token=user.box_user_token.refresh_token,
            store_tokens=user.box_user_token.update_tokens
        )
        self.box_api = Client(self.box_oauth)
        self.agave_api = Agave(api_server=settings.AGAVE_TENANT_BASEURL,
                               token=user.agave_oauth.access_token)

    def process_events_stream(self):
        events = self.user.box_events.filter(processed=False)
        for e in events:
            self.process_box_event(e)

        # stream_pos = self.user.box_stream_pos
        # last_stream_pos = stream_pos.stream_position
        # last_event_processed = stream_pos.last_event_processed
        # events = self.box_api.events().get_events(limit=self.max_events_to_process,
        #                                           stream_position=last_stream_pos,
        #                                           stream_type='changes')
        #
        # # get_events will sometimes return events we already processed.
        # # find the first one we have not processed.
        # next_index = next((i for (i, e) in enumerate(events['entries'])
        #                    if e['event_id'] == last_event_processed), -1)
        # next_index += 1
        # for e in events['entries'][next_index:]:
        #     try:
        #         self.process_box_event(e)
        #         last_event_processed = e['event_id']
        #     except:
        #         logger.error('Error processing Box event type=%s' % e['event_type'],
        #                      extra={'event': e})
        #
        # try:
        #     stream_pos.stream_position = events['next_stream_position']
        #     stream_pos.last_event_processed = last_event_processed
        #     stream_pos.save()
        # except:
        #     logger.error('Error updating Box events stream position',
        #                  extra={'user': self.user})
        #
        # if events['chunk_size'] == self.max_events_to_process:
        #     # schedule additional events processing
        #     update_box_events_stream.apply_async(args=(self.user.username,))

    def process_box_event(self, event):
        logger.info('Received Box event type=%s' % event.event_type)
        func_name = 'process_%s' % event.event_type.lower()
        try:
            func = getattr(self, func_name)
            func(event)
            event.processed = True
            event.processed_at = datetime.now()
            event.save()
        except AttributeError:
            logger.info('No processor for Box event type=%s' % event.event_type)
        except:
            logger.error('Error processing BoxUserEvent', extra={'event': event})
            if event.retry:
                logger.error('Retry processing BoxUserEvent failed for event_id=%s',
                             event.id, extra={'event': event})
                event.processed = True
                event.processed_at = datetime.now()
            else:
                event.retry = True
            event.save()

    def process_item_create(self, event):
        logger.debug(event)
        item = event.source_dict
        if event_item_in_sync_path(item):
            if item['type'] == 'folder':
                self.create_folder(event)
            elif item['type'] == 'file':
                self.download_file(event)

    def process_item_upload(self, event):
        logger.debug(event)
        item = event.source_dict
        if event_item_in_sync_path(item):
            if item['type'] == 'folder':
                self.create_folder(event)
            elif item['type'] == 'file':
                self.download_file(event)

    def create_folder(self, event):
        item = event.source_dict
        sync_path = item['path_collection']['entries']
        sync_path[0]['name'] = self.user.username
        self.ensure_sync_path(sync_path)
        fm = FileManager(self.agave_api)
        new_dir_meta, new_dir = fm.mkdir(path='/'.join([p['name'] for p in sync_path]),
                                         new=item['name'],
                                         system_id=settings.BOX_SYNC_AGAVE_SYSTEM,
                                         username=self.user.username)
        add_update_box_metadata(self.agave_api, new_dir.uuid, item['id'])

    def download_file(self, event):
        item = event.source_dict
        box_file = self.box_api.file(item['id']).get()
        download_url = self.file_download_url(box_file)

        sync_path = box_file.path_collection['entries']
        sync_path[0]['name'] = self.user.username

        store_path = '/'.join([p['name'] for p in sync_path])
        logger.info('Create item=%s for user=%s at path=%s' %
                    (box_file.name, self.user, store_path))
        file_path = '%s/%s' % (store_path, box_file.name)

        # ensure full sync_path exists
        self.ensure_sync_path(sync_path)

        # schedule file import
        try:
            import_resp = self.agave_api.files.importData(
                systemId=settings.BOX_SYNC_AGAVE_SYSTEM,
                filePath=store_path,
                fileName=box_file.name,
                urlToIngest=download_url)

            # import is async, so wait for status
            # TODO If the transfer takes more than 10 mins, this will fail.
            # TODO If the agave token expires this will fail
            # TODO If the async_resp.result times out, we should queue another check.
            try:
                async_resp = AgaveAsyncResponse(self.agave_api, import_resp)
                async_status = async_resp.result(600)
                if async_status == 'FAILED':
                    logger.error('Box File Transfer failed: %s' % file_path)
                    # TODO notify the user it failed to transfer!
                else:
                    logger.info(
                        'Indexing Box File Transfer %s' % file_path)
                    aff = AgaveFolderFile.from_path(
                        self.agave_api, settings.BOX_SYNC_AGAVE_SYSTEM, file_path)
                    meta = Object(**aff.to_dict())
                    meta.save()

                    add_update_box_metadata(self.agave_api, aff.uuid, box_file.object_id)
            except (TimeoutError, Error):
                logger.error('AsyncResponse Error on Agave.files.importData from Box',
                             extra={'box_file': box_file})
        except HTTPError:
            logger.exception('Agave.files.importData from Box Failed',
                             extra={'box_file': box_file})

    def process_item_rename(self, event):
        """
        If the event is for a known synced file:
            Look up related meta
            Look up related file
            Rename file
        """
        logger.debug(event)
        item = event.source_dict
        if event_item_in_sync_path(item):
            meta = self.get_box_sync_meta(item['id'])
            agave_file_href = meta['_links']['file']['href']
            href_parts = agave_file_href.split('/files/v2/media/system/')
            path_parts = href_parts[1].split('/')
            system_id = path_parts[0]
            store_path = '/'.join(path_parts[1:])

            fm = FileManager(self.agave_api)
            mf, aff = fm.rename(store_path, item['name'], system_id, self.user.username)
            add_update_box_metadata(self.agave_api, aff.uuid, item['id'])

    def process_item_move(self, event):
        """
        If the event is for a known synced file:
            If new path is within the sync path:
                agave.files.move
            Else:
                process_item_trash
        Else:
            process_item_create
        """
        logger.debug(event)
        item = event.source_dict
        meta = self.get_box_sync_meta(item['id'])
        if meta is not None:
            if event_item_in_sync_path(item):
                agave_file_href = meta['_links']['file']['href']
                href_parts = agave_file_href.split('/files/v2/media/system/')
                path_parts = href_parts[1].split('/')
                system_id = path_parts[0]
                store_path = '/'.join(path_parts[1:])

                new_path_parts = item['path_collection']['entries']
                new_path_parts[0]['name'] = self.user.username
                new_path = '/'.join([p['name'] for p in new_path_parts])

                fm = FileManager(self.agave_api)
                mf, aff = fm.move(store_path, new_path, system_id, self.user.username)
                add_update_box_metadata(self.agave_api, aff.uuid, item['id'])
            else:
                self.process_item_trash(event)
        else:
            self.process_item_create(event)

    def process_item_copy(self, event):
        """
        If new path is within the sync path:
            If the event is for a known synced file:
                agave.files.copy
            process_item_create

        """
        logger.debug(event)
        item = event.source_dict
        if event_item_in_sync_path(item):
            meta = self.get_box_sync_meta(item['id'])
            if meta is not None:
                agave_file_href = meta['_links']['file']['href']
                href_parts = agave_file_href.split('/files/v2/media/system/')
                path_parts = href_parts[1].split('/')
                system_id = path_parts[0]
                store_path = '/'.join(path_parts[1:])

                new_path_parts = item['path_collection']['entries']
                new_path_parts[0]['name'] = self.user.username
                new_path = '/'.join([p['name'] for p in new_path_parts])

                fm = FileManager(self.agave_api)
                mf, aff = fm.copy(store_path, new_path, system_id, self.user.username)
                add_update_box_metadata(self.agave_api, aff.uuid, item['id'])
            else:
                self.process_item_create(event)

    def process_item_trash(self, event):
        """
        Look up meta for trashed file

        If exists:
            call FileManager.delete, update box_sync_object meta to trashed=True
        """
        logger.debug(event)
        item = event.source_dict
        meta = self.get_box_sync_meta(item['id'])
        if meta is not None:
            agave_file_href = meta['_links']['file']['href']
            href_parts = agave_file_href.split('/files/v2/media/system/')
            path_parts = href_parts[1].split('/')
            system_id = path_parts[0]
            store_path = '/'.join(path_parts[1:])
            fm = FileManager(self.agave_api)
            aff = AgaveFolderFile.from_path(self.agave_api, system_id, store_path)
            fm.delete(system_id, store_path, self.user.username)
            add_update_box_metadata(self.agave_api, aff.uuid, item['id'],
                                    trashed=True)

    def process_item_undelete_via_trash(self, event):
        logger.debug(event)
        # for now just re-download?
        self.process_item_create(event)

    def get_box_sync_meta(self, box_object_id):
        query = {'name': 'box_sync_object', 'value.id': box_object_id}
        meta = self.agave_api.meta.listMetadata(q=json.dumps(query))
        if meta and len(meta) == 1:
            return meta[0]
        else:
            return None

    def file_download_url(self, box_file):
        """
        Get the File download URL instead of downloading the file.

        Args:
            box_file: a Box File item

        Returns: A URL to download the File content
        """
        content_url = box_file.get_url('content')
        headers = {
            'Authorization': 'Bearer %s' % self.user.box_user_token.access_token
        }
        resp = requests.get(content_url, headers=headers, allow_redirects=False)
        if resp.status_code == 302:
            return resp.headers['Location']

    def ensure_sync_path(self, store_path_parts):
        for i in range(1, len(store_path_parts) + 1):
            sub_path = '/'.join([p['name'] for p in store_path_parts[:i]])
            logger.debug('ensure path exists: %s' % sub_path)
            ag_file = None
            try:
                ag_file = AgaveFolderFile.from_path(
                    self.agave_api, settings.BOX_SYNC_AGAVE_SYSTEM, sub_path)
            except HTTPError:
                # mkdir
                parts = store_path_parts[:i]
                new_dir = parts.pop()
                parent_path = '/'.join([p['name'] for p in parts])
                logger.debug('Create new directory "%s" at path "%s"' % (new_dir,
                                                                         parent_path))
                fm = FileManager(agave_client=self.agave_api)
                es_file, ag_file = fm.mkdir(path=parent_path,
                                            new=new_dir,
                                            system_id=settings.BOX_SYNC_AGAVE_SYSTEM,
                                            username=self.user.username)
            except AgaveException:
                logger.exception('Failed to create local path for sync')

            if ag_file is not None:
                meta = Object().get_exact_path(ag_file.system,
                                               self.user.username,
                                               ag_file.path,
                                               ag_file.name)
                if meta is None:
                    meta = Object(**ag_file.to_dict())
                    logger.debug(meta)
                    meta.save()
                else:
                    meta.update_from_dict(**ag_file.to_dict())

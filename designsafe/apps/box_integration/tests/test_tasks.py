from django.test import TestCase
from django.contrib.auth import get_user_model
from django.conf import settings
from boxsdk.object.file import File
from designsafe.apps.box_integration import tasks
from dsapi.agave.daos import AgaveFolderFile
from designsafe.libs.elasticsearch.api import Object
from requests.exceptions import HTTPError
import copy
import json
import six
import mock
from mock import call


def load_data_fixture(name):
    return json.loads(open('designsafe/apps/box_integration/fixtures/%s' % name).read())


def load_box_events_stream_fixture(filter_type=None):
    events_stream = json.loads(
        open('designsafe/apps/box_integration/fixtures/box-events-stream.json').read())
    if filter_type is not None:
        events_stream['entries'] = [e for e in events_stream['entries']
                                    if e['event_type'] == filter_type]
    return events_stream


class BoxSyncAgentTestCase(TestCase):
    fixtures = ['user-data.json', 'box-user-token.json', 'box-event-stream-position.json']

    @mock.patch('designsafe.apps.box_integration.tasks.update_box_events_stream')
    def test_handle_box_webhook_event(self, m_update_box_events_stream):
        """
        Test that the webhook event handler triggers the update_box_events_stream task for
        each user in the received event.

        Args:
            m_update_box_events_stream:
        """
        event_data = {
            'event_type': u'uploaded',
            'item_id': u'55555512345',
            'item_name': u'all_of_the_data.tar.gz',
            'item_extension': u'gz',
            'item_type': u'file',
            'item_parent_folder_id': u'55555500001',
            'from_user_id': u'100000000',
            'to_user_ids': [u'100000000', u'200000000'],
        }
        tasks.handle_box_webhook_event(event_data)
        m_update_box_events_stream.apply_async.assert_has_calls([call(args=('ds_admin',)),
                                                                 call(args=('ds_user',))])

    @mock.patch('designsafe.apps.box_integration.tasks.BoxSyncAgent')
    def test_update_box_events_stream(self, m_box_sync_agent):
        tasks.update_box_events_stream('ds_user')

        test_user = get_user_model().objects.get(username='ds_user')
        m_box_sync_agent.assert_called_with(test_user)
        m_box_sync_agent.return_value.process_events_stream.assert_called_with()

    @mock.patch('designsafe.apps.box_integration.tasks.BoxSyncAgent.process_box_event')
    @mock.patch('boxsdk.object.events.Events.get_events')
    def test_process_events_stream(self, m_get_events, m_process_box_event):
        """
        Ensure that process box event is called for each event in the stream.

        Args:
            m_get_events:
            m_process_box_event:

        """
        events = load_box_events_stream_fixture()
        m_get_events.return_value = events

        user = get_user_model().objects.get(username='ds_user')
        agent = tasks.BoxSyncAgent(user)
        agent.process_events_stream()

        calls = []
        for e in events['entries']:
            calls.append(call(e))
        m_process_box_event.assert_has_calls(calls)

    @mock.patch('designsafe.apps.box_integration.tasks.BoxSyncAgent.process_item_create')
    @mock.patch('boxsdk.object.events.Events.get_events')
    def test_process_item_create_called(self, m_get_events, m_process_event_handler):
        events = load_box_events_stream_fixture(filter_type='ITEM_CREATE')
        m_get_events.return_value = events

        user = get_user_model().objects.get(username='ds_user')
        agent = tasks.BoxSyncAgent(user)
        agent.process_events_stream()

        m_process_event_handler.assert_called_with(events['entries'][0])

    @mock.patch('designsafe.apps.box_integration.tasks.BoxSyncAgent.process_item_upload')
    @mock.patch('boxsdk.object.events.Events.get_events')
    def test_process_item_upload_called(self, m_get_events, m_process_event_handler):
        events = load_box_events_stream_fixture(filter_type='ITEM_UPLOAD')
        m_get_events.return_value = events

        user = get_user_model().objects.get(username='ds_user')
        agent = tasks.BoxSyncAgent(user)
        agent.process_events_stream()

        m_process_event_handler.assert_called_with(events['entries'][0])

    @mock.patch('designsafe.apps.box_integration.tasks.BoxSyncAgent.process_item_move')
    @mock.patch('boxsdk.object.events.Events.get_events')
    def test_process_item_move_called(self, m_get_events, m_process_event_handler):
        events = load_box_events_stream_fixture(filter_type='ITEM_MOVE')
        m_get_events.return_value = events

        user = get_user_model().objects.get(username='ds_user')
        agent = tasks.BoxSyncAgent(user)
        agent.process_events_stream()

        m_process_event_handler.assert_called_with(events['entries'][0])

    @mock.patch('designsafe.apps.box_integration.tasks.BoxSyncAgent.process_item_copy')
    @mock.patch('boxsdk.object.events.Events.get_events')
    def test_process_item_copy_called(self, m_get_events, m_process_event_handler):
        events = load_box_events_stream_fixture(filter_type='ITEM_COPY')
        m_get_events.return_value = events

        user = get_user_model().objects.get(username='ds_user')
        agent = tasks.BoxSyncAgent(user)
        agent.process_events_stream()

        m_process_event_handler.assert_called_with(events['entries'][0])

    @mock.patch('designsafe.apps.box_integration.tasks.BoxSyncAgent.process_item_rename')
    @mock.patch('boxsdk.object.events.Events.get_events')
    def test_process_item_rename_called(self, m_get_events, m_process_event_handler):
        events = load_box_events_stream_fixture(filter_type='ITEM_RENAME')
        m_get_events.return_value = events

        user = get_user_model().objects.get(username='ds_user')
        agent = tasks.BoxSyncAgent(user)
        agent.process_events_stream()

        m_process_event_handler.assert_called_with(events['entries'][0])

    @mock.patch('designsafe.apps.box_integration.tasks.BoxSyncAgent.process_item_trash')
    @mock.patch('boxsdk.object.events.Events.get_events')
    def test_process_item_trash_called(self, m_get_events, m_process_event_handler):
        events = load_box_events_stream_fixture(filter_type='ITEM_TRASH')
        m_get_events.return_value = events

        user = get_user_model().objects.get(username='ds_user')
        agent = tasks.BoxSyncAgent(user)
        agent.process_events_stream()

        m_process_event_handler.assert_called_with(events['entries'][0])

    @mock.patch('designsafe.apps.box_integration.tasks.BoxSyncAgent.process_item_undelete_via_trash')
    @mock.patch('boxsdk.object.events.Events.get_events')
    def test_process_item_undelete_via_trash_called(self, m_get_events, m_process_event_handler):
        events = load_box_events_stream_fixture(filter_type='ITEM_UNDELETE_VIA_TRASH')
        m_get_events.return_value = events

        user = get_user_model().objects.get(username='ds_user')
        agent = tasks.BoxSyncAgent(user)
        agent.process_events_stream()

        m_process_event_handler.assert_called_with(events['entries'][0])

    @mock.patch('designsafe.apps.box_integration.tasks.add_update_box_metadata')
    @mock.patch('designsafe.libs.elasticsearch.api.Object.save')
    @mock.patch('dsapi.agave.daos.AgaveFolderFile.from_path')
    @mock.patch('agavepy.async.AgaveAsyncResponse.result')
    @mock.patch('designsafe.apps.box_integration.tasks.BoxSyncAgent.ensure_sync_path')
    @mock.patch('designsafe.apps.box_integration.tasks.BoxSyncAgent.file_download_url')
    @mock.patch('boxsdk.object.file.File.get')
    @mock.patch('agavepy.agave.Agave')
    def test_download_file(self, m_agave, m_box_file_get, m_file_download_url,
                           m_ensure_sync_path, m_async_result, m_agave_file_from_path,
                           m_es_object_save, m_add_update_box_metadata):

        # load mock data
        events = load_box_events_stream_fixture(filter_type='ITEM_UPLOAD')
        event = events['entries'][0]

        item_name = event['source']['name']
        item_path_parts = copy.deepcopy(event['source']['path_collection']['entries'])
        item_path_parts[0]['name'] = 'ds_user'
        item_path = '/'.join([p['name'] for p in item_path_parts])
        item_download_url = \
            'https://box.example.com/download/asdf1234qwer5678/%s' % item_name

        # pre-conditions
        m_box_file_get.return_value = File(None, event['source']['id'], event['source'])
        m_file_download_url.return_value = item_download_url

        user = get_user_model().objects.get(username='ds_user')
        agent = tasks.BoxSyncAgent(user)
        agent.agave_api.files.importData = mock.Mock()
        mock_import_resp = load_data_fixture('agave_import_data_resp.json')
        agent.agave_api = m_agave
        agent.agave_api.files.importData.return_value = mock.Mock(**mock_import_resp)
        m_async_result.return_value = 'FINISHED'
        m_aff = mock.Mock(spec=AgaveFolderFile)
        m_aff.uuid = 'agave_asdf1234'
        m_aff.to_dict.return_value = {}
        m_agave_file_from_path.return_value = m_aff

        # event
        agent.download_file(event)

        # post-conditions
        m_ensure_sync_path.assert_called_with(item_path_parts)
        agent.agave_api.files.importData.assert_called_with(
            systemId=settings.BOX_SYNC_AGAVE_SYSTEM,
            filePath=item_path,
            fileName=item_name,
            urlToIngest=item_download_url)
        m_agave_file_from_path.assert_called_with(agent.agave_api,
                                                  settings.BOX_SYNC_AGAVE_SYSTEM,
                                                  '%s/%s' % (item_path, item_name))
        m_es_object_save.assert_called_with()
        m_add_update_box_metadata.assert_called_with(agent.agave_api, 'agave_asdf1234',
                                                     event['source']['id'])

    @mock.patch('designsafe.apps.box_integration.tasks.add_update_box_metadata')
    @mock.patch('dsapi.agave.daos.FileManager.mkdir')
    @mock.patch('designsafe.apps.box_integration.tasks.BoxSyncAgent.ensure_sync_path')
    def test_create_folder(self, m_ensure_sync_path, m_fm_mkdir,
                           m_add_update_box_metadata):
        events = load_box_events_stream_fixture(filter_type='ITEM_UPLOAD')
        event = events['entries'][0]

        item_name = event['source']['name']
        item_path_parts = copy.deepcopy(event['source']['path_collection']['entries'])
        item_path_parts[0]['name'] = 'ds_user'
        item_path = '/'.join([p['name'] for p in item_path_parts])

        m_aff = mock.Mock(spec=AgaveFolderFile)
        m_aff.uuid = 'agave_asdf1234'
        m_fm_mkdir.return_value = ({}, m_aff)

        user = get_user_model().objects.get(username='ds_user')
        agent = tasks.BoxSyncAgent(user)

        agent.create_folder(event)

        m_ensure_sync_path.assert_called_with(item_path_parts)
        m_fm_mkdir.assert_called_with(path=item_path,
                                      new=item_name,
                                      system_id=settings.BOX_SYNC_AGAVE_SYSTEM,
                                      username='ds_user')

        m_add_update_box_metadata.assert_called_with(agent.agave_api, 'agave_asdf1234',
                                                     event['source']['id'])

    @mock.patch('designsafe.apps.box_integration.tasks.add_update_box_metadata')
    @mock.patch('dsapi.agave.daos.FileManager.move')
    @mock.patch('designsafe.apps.box_integration.tasks.BoxSyncAgent.get_box_sync_meta')
    def test_process_item_move(self, m_get_box_sync_meta, m_fm_operation,
                               m_add_update_box_metadata):
        events = load_box_events_stream_fixture(filter_type='ITEM_MOVE')
        event = events['entries'][0]

        box_object_meta = load_data_fixture('agave-meta-box-sync-object-before-move.json')
        m_get_box_sync_meta.return_value = box_object_meta

        file_uri = box_object_meta['_links']['file']['href']
        file_uri_parts = file_uri.split('/files/v2/media/system/')
        file_uri_parts = file_uri_parts[1].split('/')
        system_id = file_uri_parts[0]
        old_path = '/'.join(file_uri_parts[1:])

        new_path_parts = event['source']['path_collection']['entries']
        new_path_parts[0]['name'] = 'ds_user'
        new_path = '/'.join([p['name'] for p in new_path_parts])

        aff = mock.Mock(spec=AgaveFolderFile, uuid=box_object_meta['associationIds'][0])
        m_fm_operation.return_value = ({}, aff)

        user = get_user_model().objects.get(username='ds_user')
        agent = tasks.BoxSyncAgent(user)

        agent.process_item_move(event)

        m_fm_operation.assert_called_with(old_path, new_path, system_id, 'ds_user')
        m_add_update_box_metadata.assert_called_with(agent.agave_api, aff.uuid,
                                                     event['source']['id'])

    @mock.patch('designsafe.apps.box_integration.tasks.add_update_box_metadata')
    @mock.patch('dsapi.agave.daos.FileManager.copy')
    @mock.patch('designsafe.apps.box_integration.tasks.BoxSyncAgent.get_box_sync_meta')
    def test_process_item_copy(self, m_get_box_sync_meta, m_fm_operation,
                               m_add_update_box_metadata):
        events = load_box_events_stream_fixture(filter_type='ITEM_COPY')
        event = events['entries'][0]
        item_id = event['source']['id']

        box_object_meta = load_data_fixture('agave-meta-box-sync-object-before-copy.json')

        # copy generates a new id
        self.assertNotEqual(box_object_meta['value']['id'], item_id)

        m_get_box_sync_meta.return_value = box_object_meta

        file_uri = box_object_meta['_links']['file']['href']
        file_uri_parts = file_uri.split('/files/v2/media/system/')
        file_uri_parts = file_uri_parts[1].split('/')
        system_id = file_uri_parts[0]
        old_path = '/'.join(file_uri_parts[1:])

        new_path_parts = event['source']['path_collection']['entries']
        new_path_parts[0]['name'] = 'ds_user'
        new_path = '/'.join([p['name'] for p in new_path_parts])

        aff = mock.Mock(spec=AgaveFolderFile, uuid=box_object_meta['associationIds'][0])
        m_fm_operation.return_value = ({}, aff)

        user = get_user_model().objects.get(username='ds_user')
        agent = tasks.BoxSyncAgent(user)

        agent.process_item_copy(event)

        m_fm_operation.assert_called_with(old_path, new_path, system_id, 'ds_user')
        m_add_update_box_metadata.assert_called_with(agent.agave_api, aff.uuid, item_id)

    @mock.patch('designsafe.apps.box_integration.tasks.add_update_box_metadata')
    @mock.patch('dsapi.agave.daos.FileManager.rename')
    @mock.patch('designsafe.apps.box_integration.tasks.BoxSyncAgent.get_box_sync_meta')
    def test_process_item_rename(self, m_get_box_sync_meta, m_fm_rename,
                                 m_add_update_box_metadata):
        events = load_box_events_stream_fixture(filter_type='ITEM_RENAME')
        event = events['entries'][0]

        box_object_meta = \
            load_data_fixture('agave-meta-box-sync-object-before-rename.json')
        m_get_box_sync_meta.return_value = box_object_meta

        store_path = 'ds_user/DesignSafe-CI-Sync/test_upload.jpg'
        new_name = 'test_rename.jpg'
        system_id = 'storage.example.com'

        aff = mock.Mock(spec=AgaveFolderFile, uuid=box_object_meta['associationIds'][0])
        m_fm_rename.return_value = ({}, aff)

        user = get_user_model().objects.get(username='ds_user')
        agent = tasks.BoxSyncAgent(user)

        agent.process_item_rename(event)

        m_fm_rename.assert_called_with(store_path, new_name, system_id, 'ds_user')
        m_add_update_box_metadata.assert_called_with(agent.agave_api, aff.uuid,
                                                     event['source']['id'])

    @mock.patch('designsafe.apps.box_integration.tasks.add_update_box_metadata')
    @mock.patch('dsapi.agave.daos.AgaveFolderFile.from_path')
    @mock.patch('dsapi.agave.daos.FileManager.delete')
    @mock.patch('designsafe.apps.box_integration.tasks.BoxSyncAgent.get_box_sync_meta')
    def test_process_item_trash(self, m_get_box_sync_meta, m_fm_operation,
                                m_aff_from_path, m_add_update_box_metadata):
        events = load_box_events_stream_fixture(filter_type='ITEM_TRASH')
        event = events['entries'][0]

        box_object_meta = \
            load_data_fixture('agave-meta-box-sync-object-before-trash.json')
        m_get_box_sync_meta.return_value = box_object_meta

        store_path = 'ds_user/DesignSafe-CI-Sync/test_rename.jpg'
        system_id = 'storage.example.com'

        aff = mock.Mock(spec=AgaveFolderFile, uuid=box_object_meta['associationIds'][0])
        m_aff_from_path.return_value = aff

        user = get_user_model().objects.get(username='ds_user')
        agent = tasks.BoxSyncAgent(user)

        agent.process_item_trash(event)

        m_fm_operation.assert_called_with(system_id, store_path, 'ds_user')
        m_add_update_box_metadata.assert_called_with(agent.agave_api, aff.uuid,
                                                     event['source']['id'],
                                                     trashed=True)

    @mock.patch('designsafe.apps.box_integration.tasks.BoxSyncAgent.process_item_create')
    def test_process_item_undelete_via_trash(self, m_process_item_create):
        events = load_box_events_stream_fixture(filter_type='ITEM_UNDELETE_VIA_TRASH')
        event = events['entries'][0]

        user = get_user_model().objects.get(username='ds_user')
        agent = tasks.BoxSyncAgent(user)

        agent.process_item_undelete_via_trash(event)

        m_process_item_create.assert_called_with(event)

    @mock.patch('designsafe.libs.elasticsearch.api.Object.update_from_dict')
    @mock.patch('designsafe.libs.elasticsearch.api.Object.get_exact_path')
    @mock.patch('dsapi.agave.daos.AgaveFolderFile.from_path')
    def test_ensure_sync_path(self, m_aff_from_path, m_es_get_exact_path, m_es_update):

        store_path_parts = [
            {'name': 'ds_user', 'system': settings.BOX_SYNC_AGAVE_SYSTEM, 'path': '/'},
            {'name': 'DesignSafe-CI-Sync', 'system': settings.BOX_SYNC_AGAVE_SYSTEM,
             'path': 'ds_user'},
        ]

        user = get_user_model().objects.get(username='ds_user')
        agent = tasks.BoxSyncAgent(user)

        m_aff_from_path.side_effect = [mock_agave_folder_file(**p)
                                       for p in store_path_parts]

        m_es_get_exact_path.side_effect = [Object(**p)
                                           for p in store_path_parts]

        agent.ensure_sync_path(store_path_parts)

        expected_calls = [
            call(agent.agave_api, settings.BOX_SYNC_AGAVE_SYSTEM, 'ds_user'),
            call(agent.agave_api, settings.BOX_SYNC_AGAVE_SYSTEM,
                 'ds_user/DesignSafe-CI-Sync'),
        ]
        m_aff_from_path.assert_has_calls(expected_calls)

        expected_calls = [
            call(settings.BOX_SYNC_AGAVE_SYSTEM, 'ds_user', '/', 'ds_user'),
            call(settings.BOX_SYNC_AGAVE_SYSTEM, 'ds_user', 'ds_user',
                 'DesignSafe-CI-Sync'),
        ]
        m_es_get_exact_path.assert_has_calls(expected_calls)

        expected_calls = [
            call(**store_path_parts[0]),
            call(**store_path_parts[1])
        ]
        m_es_update.assert_has_calls(expected_calls)

    @mock.patch('designsafe.libs.elasticsearch.api.Object.update_from_dict')
    @mock.patch('designsafe.libs.elasticsearch.api.Object.save')
    @mock.patch('designsafe.libs.elasticsearch.api.Object.get_exact_path')
    @mock.patch('dsapi.agave.daos.AgaveFolderFile.from_path')
    def test_ensure_sync_path_unindexed(self, m_aff_from_path, m_es_get_exact_path,
                                        m_es_save, m_es_update):

        store_path_parts = [
            {'name': 'ds_user', 'system': settings.BOX_SYNC_AGAVE_SYSTEM, 'path': '/'},
            {'name': 'DesignSafe-CI-Sync', 'system': settings.BOX_SYNC_AGAVE_SYSTEM,
             'path': 'ds_user'},
            {'name': 'Projects', 'system': settings.BOX_SYNC_AGAVE_SYSTEM,
             'path': 'ds_user/DesignSafe-CI-Sync'},
        ]

        user = get_user_model().objects.get(username='ds_user')
        agent = tasks.BoxSyncAgent(user)

        m_aff_from_path.side_effect = [mock_agave_folder_file(**p)
                                       for p in store_path_parts]

        m_es_get_exact_path.side_effect = [Object(**p)
                                           for p in store_path_parts[:2]] + [None]

        agent.ensure_sync_path(store_path_parts)

        expected_calls = [
            call(agent.agave_api, settings.BOX_SYNC_AGAVE_SYSTEM, 'ds_user'),
            call(agent.agave_api, settings.BOX_SYNC_AGAVE_SYSTEM,
                 'ds_user/DesignSafe-CI-Sync'),
            call(agent.agave_api, settings.BOX_SYNC_AGAVE_SYSTEM,
                 'ds_user/DesignSafe-CI-Sync/Projects'),
        ]
        m_aff_from_path.assert_has_calls(expected_calls)

        expected_calls = [
            call(settings.BOX_SYNC_AGAVE_SYSTEM, 'ds_user', '/', 'ds_user'),
            call(settings.BOX_SYNC_AGAVE_SYSTEM, 'ds_user', 'ds_user',
                 'DesignSafe-CI-Sync'),
            call(settings.BOX_SYNC_AGAVE_SYSTEM, 'ds_user', 'ds_user/DesignSafe-CI-Sync',
                 'Projects'),
        ]
        m_es_get_exact_path.assert_has_calls(expected_calls)

        expected_calls = [
            call(**store_path_parts[0]),
            call(**store_path_parts[1])
        ]
        m_es_update.assert_has_calls(expected_calls)

        m_es_save.assert_has_calls([call()])

    @mock.patch('designsafe.libs.elasticsearch.api.Object.update_from_dict')
    @mock.patch('designsafe.libs.elasticsearch.api.Object.save')
    @mock.patch('designsafe.libs.elasticsearch.api.Object.get_exact_path')
    @mock.patch('dsapi.agave.daos.FileManager.mkdir')
    @mock.patch('dsapi.agave.daos.AgaveFolderFile.from_path')
    def test_ensure_sync_path_mkdir(self, m_aff_from_path, m_fm_mkdir, m_es_get_exact_path,
                              m_es_save, m_es_update):

        store_path_parts = [
            {'name': 'ds_user', 'system': settings.BOX_SYNC_AGAVE_SYSTEM, 'path': '/'},
            {'name': 'DesignSafe-CI-Sync', 'system': settings.BOX_SYNC_AGAVE_SYSTEM,
             'path': 'ds_user'},
            {'name': 'Projects', 'system': settings.BOX_SYNC_AGAVE_SYSTEM,
             'path': 'ds_user/DesignSafe-CI-Sync'},
            {'name': 'Testing', 'system': settings.BOX_SYNC_AGAVE_SYSTEM,
             'path': 'ds_user/DesignSafe-CI-Sync/Projects'},
        ]

        user = get_user_model().objects.get(username='ds_user')
        agent = tasks.BoxSyncAgent(user)

        m_aff_from_path.side_effect = [mock_agave_folder_file(**p)
                                       for p in store_path_parts[:3]] + [HTTPError]

        m_fm_mkdir.return_value = ({}, mock_agave_folder_file(**store_path_parts[3]))

        m_es_get_exact_path.side_effect = [Object(**p)
                                           for p in store_path_parts[:3]] + [None]

        agent.ensure_sync_path(store_path_parts)

        expected_calls = [
            call(agent.agave_api, settings.BOX_SYNC_AGAVE_SYSTEM, 'ds_user'),
            call(agent.agave_api, settings.BOX_SYNC_AGAVE_SYSTEM,
                 'ds_user/DesignSafe-CI-Sync'),
        ]
        m_aff_from_path.assert_has_calls(expected_calls)

        expected_calls = [
            call(settings.BOX_SYNC_AGAVE_SYSTEM, 'ds_user', '/', 'ds_user'),
            call(settings.BOX_SYNC_AGAVE_SYSTEM, 'ds_user', 'ds_user',
                 'DesignSafe-CI-Sync'),
            call(settings.BOX_SYNC_AGAVE_SYSTEM, 'ds_user', 'ds_user/DesignSafe-CI-Sync',
                 'Projects'),
            call(settings.BOX_SYNC_AGAVE_SYSTEM, 'ds_user',
                 'ds_user/DesignSafe-CI-Sync/Projects', 'Testing'),
        ]
        m_es_get_exact_path.assert_has_calls(expected_calls)

        expected_calls = [
            call(**store_path_parts[0]),
            call(**store_path_parts[1]),
            call(**store_path_parts[2]),
        ]
        m_es_update.assert_has_calls(expected_calls)
        m_es_save.assert_has_calls([call()])


def mock_agave_folder_file(**kwargs):
    aff_mock = mock.Mock(spec=AgaveFolderFile)
    for k, v in six.iteritems(kwargs):
        setattr(aff_mock, k, v)
    aff_mock.to_dict.return_value = kwargs
    return aff_mock

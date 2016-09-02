from django.test import TestCase
from django.contrib.auth import get_user_model
from django.conf import settings
from designsafe.apps.api.exceptions import ApiException
from designsafe.apps.api.data.agave.filemanager import FileManager, AgaveIndexer
from designsafe.apps.api.data.agave.file import AgaveFile
from designsafe.apps.api.data.agave.elasticsearch.documents import Object
from designsafe.apps.auth.models import AgaveOAuthToken
from agavepy.agave import Agave
import mock
import json
import os

class FileManagerBaseTestCase(TestCase):
    fixtures = ['user-data.json', 'agave-oauth-token-data.json']

    def setUp(self):
        user = get_user_model().objects.get(pk=2)
        user.set_password('password')
        user.save()
        self.user = user
        self.fm = self.get_filemanager()
        with open('designsafe/apps/api/fixtures/agave_home_listing.json') as f:
            home_listing_json = json.load(f)
        self.home_listing_json = home_listing_json

        with open('designsafe/apps/api/fixtures/agave_trash_listing.json') as f:
            trash_listing_json = json.load(f)
        self.trash_listing_json = trash_listing_json

        with open('designsafe/apps/api/fixtures/agave_agavefs_listing.json') as f:
            agavefs_listing_json = json.load(f)
        self.agavefs_listing_json = agavefs_listing_json

    @mock.patch('agavepy.agave.Agave.__init__')
    @mock.patch('designsafe.apps.auth.models.AgaveOAuthToken.refresh')
    def get_filemanager(self, agave_oauth_refresh, agave_init):
        agave_init.return_value = None
        agave_oauth_refresh.return_value = None
        fm = FileManager(self.user)
        return fm

class FileManagerIndexerGeneratorTestCase(FileManagerBaseTestCase):
    @mock.patch.object(AgaveIndexer, 'call_operation')
    def test_walk_creating_correct_objects(self, mock_agave_call_op):
        system = settings.AGAVE_STORAGE_SYSTEM
        path = 'ds_user'
        mock_agave_call_op.side_effect = [self.home_listing_json, 
                    self.trash_listing_json, self.agavefs_listing_json]
        objs = self.home_listing_json + self.trash_listing_json + self.agavefs_listing_json
        dirs = filter(lambda x: x['type'] == 'dir' and x['name'] != '.', objs)
        
        with mock.patch('designsafe.apps.api.data.agave.filemanager.AgaveFile', 
                                             spec = True) as mock_af_cls:
            #call to func
            res = [o for o in self.fm.indexer.walk(system, path)]
            mock_af_cls_calls = mock_af_cls.call_args_list
            cnt = 0
            for o in objs:
                call = mock.call(agave_client = self.fm.indexer.agave_client,
                            wrap = o)
                self.assertIn(call, mock_af_cls_calls)
                cnt += 1
            self.assertEqual(mock_af_cls.call_count, cnt)

    @mock.patch.object(AgaveIndexer, 'call_operation')
    def test_walk_calling_listing_correctly(self, mock_agave_call_op):
        system = 'storage.example.com'
        path = 'ds_user'
        mock_agave_call_op.side_effect = [self.home_listing_json, 
                    self.trash_listing_json, self.agavefs_listing_json]
        objs = self.home_listing_json + self.trash_listing_json + self.agavefs_listing_json
        dirs = filter(lambda x: x['type'] == 'dir' and x['name'] != '.', objs)
        #call to func
        res = [o for o in self.fm.indexer.walk(system, path)]
        mock_agave_call_op_calls = mock_agave_call_op.call_args_list
        cnt = 0
        for d in dirs:
            call = mock.call('files.list', systemId = d['system'],
                        filePath = d['path'])
            self.assertIn(call, mock_agave_call_op_calls)
            cnt += 1
        self.assertEqual(mock_agave_call_op.call_count, cnt + 1)

class FileIndexingTestCase(FileManagerBaseTestCase):
    pass

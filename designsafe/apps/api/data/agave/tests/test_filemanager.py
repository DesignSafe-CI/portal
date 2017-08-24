from django.test import TestCase
from django.contrib.auth import get_user_model
from django.conf import settings
from designsafe.apps.api.exceptions import ApiException
from designsafe.apps.api.data.agave.filemanager import FileManager
from designsafe.apps.api.data.agave.file import AgaveFile
from designsafe.apps.api.data.agave.elasticsearch.documents import Object
from designsafe.apps.auth.models import AgaveOAuthToken
from agavepy.agave import Agave
import mock
import json

#class FileManagerBaseTestCase(TestCase):
#    fixtures = ['user-data.json', 'agave-oauth-token-data.json']
#
#    def setUp(self):
#        user = get_user_model().objects.get(pk=2)
#        user.set_password('password')
#        user.save()
#        self.user = user
#
#    @mock.patch('agavepy.agave.Agave.__init__')
#    @mock.patch('designsafe.apps.auth.models.AgaveOAuthToken.refresh')
#    def get_filemanager(self, agave_oauth_refresh, agave_init):
#        agave_init.return_value = None
#        agave_oauth_refresh.return_value = None
#        fm = FileManager(self.user)
#        return fm
#
#
#class FileManagerTestCase(FileManagerBaseTestCase):
#    def test_filemanager_initialization(self):
#        """Test correct FileManager initialization
#
#        Asserts:
#        --------
#
#            * Agave client gets called with the correct args
#            * Username is correctly set
#        """
#        fm = FileManager(self.user)
#        self.assertEqual(fm.agave_client._token, self.user.agave_oauth.access_token)
#        self.assertEqual(fm.username, self.user.username)
#
#    def test_is_shared(self):
#        """Test if a file is shared with a user
#
#        Asserts:
#        --------
#            
#            * If folder is shared
#            * If file is shared
#        """
#        fm = self.get_filemanager()
#        folder_not_shared = fm.is_shared('%s/%s/folder' % (settings.AGAVE_STORAGE_SYSTEM, self.user.username))
#        self.assertEqual(folder_not_shared, False)
#
#        file_not_shared = fm.is_shared('%s/%s/folder/file.txt' % (settings.AGAVE_STORAGE_SYSTEM, self.user.username))
#        self.assertEqual(file_not_shared, False)
#
#        folder_is_shared = fm.is_shared('%s/%s/folder' % (settings.AGAVE_STORAGE_SYSTEM, 'another_username'))
#        self.assertEqual(folder_is_shared, True)
#
#        file_is_shared = fm.is_shared('%s/%s/folder/file.txt' % (settings.AGAVE_STORAGE_SYSTEM, 'another_username'))
#        self.assertEqual(file_is_shared, True)
#
#    def test_folder_parse_file_id(self):
#        fm = self.get_filemanager()
#        path = '%s/path/to/folder' % (self.user.username)
#        file_id = '%s/%s' % (settings.AGAVE_STORAGE_SYSTEM, path)
#
#        system, file_user, file_path = fm.parse_file_id(file_id)
#
#        self.assertEqual(system, settings.AGAVE_STORAGE_SYSTEM)
#        self.assertEqual(file_user, self.user.username)
#        self.assertEqual(file_path, path)
#
#    def test_file_parse_file_id(self):
#        fm = self.get_filemanager()
#
#        path = '%s/path/to/file.txt' % (self.user.username)
#        file_id = '%s/%s' % (settings.AGAVE_STORAGE_SYSTEM, path)
#
#        system, file_user, file_path = fm.parse_file_id(file_id)
#
#        self.assertEqual(system, settings.AGAVE_STORAGE_SYSTEM)
#        self.assertEqual(file_user, self.user.username)
#        self.assertEqual(file_path, path)
#
#    def test_default_parse_file_id(self):
#        fm = self.get_filemanager()
#        system, file_user, file_path = fm.parse_file_id('')
#
#        self.assertEqual(system, settings.AGAVE_STORAGE_SYSTEM)
#        self.assertEqual(file_user, self.user.username)
#        self.assertEqual(file_path, self.user.username)
#
#
#class FileManagerListingTestCase(FileManagerBaseTestCase):
#
#    @mock.patch('designsafe.apps.api.data.agave.filemanager.AgaveIndexer.index')
#    @mock.patch('designsafe.apps.api.data.agave.filemanager.FileManager._agave_listing')
#    @mock.patch.object(FileManager, '_es_listing')
#    def test_listing_agave_fallback(self, mock_es_listing, mock_agave_listing, mock_aidexer_index):
#        fm = self.get_filemanager()
#        
#        path = '%s/path/to/folder' % (self.user.username)
#        file_id = '%s/%s' % (settings.AGAVE_STORAGE_SYSTEM, path)
#
#        mock_es_listing.return_value = None
#        
#        fm.listing(file_id)
#        
#        mock_agave_listing.assert_called_with(settings.AGAVE_STORAGE_SYSTEM, path)
#
#    @mock.patch.object(FileManager, '_es_listing')
#    def test_listing_es(self, mock_es_listing):
#        fm = self.get_filemanager()
#        
#        path = '%s/path/to/folder' % (self.user.username)
#        file_id = '%s/%s' % (settings.AGAVE_STORAGE_SYSTEM, path)
#        mock_es_listing.return_value = {'id': file_id,
#                                        'type': 'folder',
#                                        'children': [{'test': 'test'}]}
#        fm.listing(file_id)
#        
#        mock_es_listing.assert_called_with(settings.AGAVE_STORAGE_SYSTEM, self.user.username, path)
#
#
#class FileManagerCopyTestCase(FileManagerBaseTestCase):
#
#    @mock.patch('designsafe.apps.api.data.agave.elasticsearch.documents.Object.from_file_path')
#    @mock.patch('designsafe.apps.api.data.agave.file.AgaveFile.from_file_path')
#    def test_agave_file_copy_same_resource_and_system(self, mock_agave_file_from_file_path,
#                                    mock_object_from_file_path):
#        fm = self.get_filemanager()
#
#        path = '%s/path/to/folder' % (self.user.username)
#        file_id = '%s/%s' % (settings.AGAVE_STORAGE_SYSTEM, path)
#        dest_path = '%s/path/to/copy/dest' % (self.user.username)
#        dest_file_id = '%s/%s' % (settings.AGAVE_STORAGE_SYSTEM, dest_path)
#        
#        mock_af = mock.Mock(spec = AgaveFile)
#        type(mock_af).name = mock.PropertyMock(return_value = 'folder')
#        mock_esf = mock.Mock(spec = Object)
#    
#        mock_agave_file_from_file_path.return_value = mock_af
#        mock_object_from_file_path.return_value = mock_esf
#        
#        fm.copy(file_id, fm.resource, dest_file_id)
#
#        mock_agave_file_from_file_path.assert_called_with(settings.AGAVE_STORAGE_SYSTEM,
#                self.user.username, path, agave_client = fm.agave_client)
#        mock_object_from_file_path.assert_called_with(settings.AGAVE_STORAGE_SYSTEM,
#                self.user.username, path)
#
#        copy_path = '%s/%s' % (dest_path, mock_af.name)
#        mock_af.copy.assert_called_with(copy_path)
#        mock_esf.copy.assert_called_with(self.user.username, copy_path)
#
#    @mock.patch('designsafe.apps.api.data.agave.filemanager.FileManager.import_file')
#    @mock.patch('designsafe.apps.api.data.agave.file.AgaveFile.from_file_path')
#    def test_agave_file_copy_same_resource_different_system(
#        self, mock_agave_file_from_file_path, mock_fm_import):
#
#        fm = self.get_filemanager()
#
#        path = '%s/path/to/folder' % (self.user.username)
#        file_id = '%s/%s' % (settings.AGAVE_STORAGE_SYSTEM, path)
#        dest_system = 'another.system.id'
#        dest_path = '%s/path/to/copy/dest' % (self.user.username)
#        dest_file_id = '%s/%s' % (dest_system, dest_path)
#
#        mock_af = mock.Mock(spec=AgaveFile)
#        type(mock_af).name = mock.PropertyMock(return_value='folder')
#        mock_agave_file_from_file_path.return_value = mock_af
#
#        fm.copy(file_id, fm.resource, dest_file_id)
#        
#        mock_fm_import.assert_called_with(dest_file_id, mock_af.name, 'agave://' + file_id)
#
#    @mock.patch('designsafe.apps.api.data.agave.filemanager.FileManager.transfer')
#    def test_agave_file_copy_different_resource(self, mock_fm_transfer):
#        fm = self.get_filemanager()
#
#        path = '%s/path/to/folder' % (self.user.username)
#        file_id = '%s/%s' % (settings.AGAVE_STORAGE_SYSTEM, path)
#        dest_resource = 'box'
#        dest_file_id = 'box/file/00314'
#        
#        fm.copy(file_id, 'box', dest_file_id)
#        
#        mock_fm_transfer.assert_called_with(file_id, dest_resource, dest_file_id)
#
#    @mock.patch('designsafe.apps.api.data.agave.filemanager.FileManager.transfer')
#    def test_agave_file_copy_unknown_dest(self, mock_fm_transfer):
#        # TODO: what is this test for?
#        """
#        :param mock_fm_transfer:
#        :return:
#        """
#        fm = self.get_filemanager()
#
#        path = '%s/path/to/folder' % (self.user.username)
#        file_id = '%s/%s' % (settings.AGAVE_STORAGE_SYSTEM, path)
#        dest_resource = 'box'
#        dest_file_id = 'box/file/00314'
#
#        fm.copy(file_id, 'box', dest_file_id)
#        
#        mock_fm_transfer.assert_called_with(file_id, dest_resource, dest_file_id)
#
#
#class FileManagerDeleteTestCase(FileManagerBaseTestCase):
#    @mock.patch('designsafe.apps.api.data.agave.elasticsearch.documents.Object.from_file_path')
#    @mock.patch('designsafe.apps.api.data.agave.file.AgaveFile.from_file_path')
#    def test_agave_file_delete(self, mock_agave_file_from_file_path,
#                                    mock_object_from_file_path):
#        fm = self.get_filemanager()
#
#        path = '%s/path/to/folder' % (self.user.username)
#        file_id = '%s/%s' % (settings.AGAVE_STORAGE_SYSTEM, path)
#
#        mock_af = mock.Mock(spec = AgaveFile)
#        mock_esf = mock.Mock(spec = Object)
#
#        mock_agave_file_from_file_path.return_value = mock_af
#        mock_object_from_file_path.return_value = mock_esf
#
#        fm.delete(file_id)
#
#        mock_agave_file_from_file_path.assert_called_with(settings.AGAVE_STORAGE_SYSTEM,
#                self.user.username, path, agave_client = fm.agave_client)
#        mock_object_from_file_path.assert_called_with(settings.AGAVE_STORAGE_SYSTEM,
#                self.user.username, path)
#        self.assertTrue(mock_af.delete.called)
#        self.assertTrue(mock_esf.delete_recursive.called)
#        
#class FileManagerDownloadTestCase(FileManagerBaseTestCase):
#    @mock.patch('designsafe.apps.api.data.agave.file.AgaveFile.from_file_path')
#    @mock.patch('designsafe.apps.api.data.agave.file.AgaveFile.create_postit')
#    def test_file_download(self, mock_agave_create_postit, mock_agave_from_file_path):
#        fm = self.get_filemanager()
#        
#        path = '%s/path/to/folder' % (self.user.username)
#        file_id = '%s/%s' % (settings.AGAVE_STORAGE_SYSTEM, path)
#        
#        with open('designsafe/apps/api/fixtures/agave_file.json') as f:
#            af_json = json.load(f)
#        
#        af = AgaveFile(wrap = af_json[0])
#        mock_agave_from_file_path.return_value = af
#
#        fm.download(file_id)
#
#        mock_agave_from_file_path.assert_called_with(
#            settings.AGAVE_STORAGE_SYSTEM, self.user.username, path,
#            agave_client=fm.agave_client)
#        
#        mock_agave_create_postit.assert_called_with(force=True,
#                                                    lifetime=3600,
#                                                    max_uses=10)
#
#    @mock.patch('designsafe.apps.api.data.agave.file.AgaveFile.from_file_path')
#    @mock.patch('designsafe.apps.api.data.agave.file.AgaveFile.create_postit')
#    def test_folder_download(self, mock_agave_create_postit, mock_agave_from_file_path):
#        fm = self.get_filemanager()
#        
#        path = '%s/path/to/folder' % (self.user.username)
#        file_id = '%s/%s' % (settings.AGAVE_STORAGE_SYSTEM, path)
#        
#        with open('designsafe/apps/api/fixtures/agave_folder.json') as f:
#            af_json = json.load(f)
#        
#        af = AgaveFile(wrap = af_json[0])
#        mock_agave_from_file_path.return_value = af
#
#        with(self.assertRaises(ApiException)):
#            download_link = fm.download(file_id)
#
#        mock_agave_from_file_path.assert_called_with(settings.AGAVE_STORAGE_SYSTEM, self.user.username, path, agave_client = fm.agave_client)
#        
#        self.assertFalse(mock_agave_create_postit.called, 
#                'Should not create postit for folders')
#
#class FileManagerMoveTestCase(FileManagerBaseTestCase):
#    @mock.patch('designsafe.apps.api.data.agave.file.AgaveFile.to_dict')
#    @mock.patch.object(Object, 'from_file_path')
#    @mock.patch.object(Object, 'move')
#    @mock.patch('designsafe.apps.api.data.agave.file.AgaveFile.move')
#    @mock.patch('designsafe.apps.api.data.agave.file.AgaveFile.from_file_path')
#    def test_move_file(self, mock_agave_from_file_path, mock_agave_file_move, 
#        mock_object_move, mock_object_from_file_path, mock_agave_file_to_dict):
#        fm = self.get_filemanager()
#        
#        path = '%s/path/to/folder' % (self.user.username)
#        file_id = '%s/%s' % (settings.AGAVE_STORAGE_SYSTEM, path)
#        dest_path = '%s/path/to/move/dest' % (self.user.username)
#        dest_file_id = '%s/%s' % (settings.AGAVE_STORAGE_SYSTEM, dest_path)
#
#
#        with open('designsafe/apps/api/fixtures/agave_folder.json') as f:
#            af_json = json.load(f)
#
#        mock_af = mock.Mock(spec = AgaveFile)
#        type(mock_af).name = mock.PropertyMock(return_value='folder')
#        mock_agave_from_file_path.return_value = mock_af
#        mock_esf = mock.Mock(spec = Object)
#        mock_object_from_file_path.return_value = mock_esf
#
#        fm.move(file_id, fm.resource, dest_file_id)
#
#        dest_full_path = '%s/%s' % (dest_path, mock_af.name)
#        mock_agave_from_file_path.assert_called_with(settings.AGAVE_STORAGE_SYSTEM,
#                  self.user.username, path, agave_client = fm.agave_client)
#        mock_af.move.assert_called_with(dest_full_path)
#
#        mock_object_from_file_path.assert_called_with(settings.AGAVE_STORAGE_SYSTEM,
#                            self.user.username, path)
#        mock_esf.move.assert_called_with(self.user.username, dest_full_path)
#
#    @mock.patch('designsafe.apps.api.data.agave.file.AgaveFile.to_dict')
#    @mock.patch('designsafe.apps.api.data.agave.elasticsearch.documents.Object.from_file_path')
#    @mock.patch.object(Object, 'move')
#    @mock.patch('designsafe.apps.api.data.agave.file.AgaveFile.move')
#    @mock.patch('designsafe.apps.api.data.agave.file.AgaveFile.from_file_path')
#    def test_move_file_same_resource_different_system(self, mock_agave_from_file_path, 
#        mock_agave_file_move, mock_object_move, mock_object_from_file_path, 
#        mock_agave_file_to_dict):
#        fm = self.get_filemanager()
#        
#        path = '%s/path/to/folder' % (self.user.username)
#        file_id = '%s/%s' % (settings.AGAVE_STORAGE_SYSTEM, path)
#        dest_path = '%s/path/to/another_folder' % (self.user.username)
#        dest_file_id = '%s/%s' % ('agave.different.system', dest_path)
#        
#        with open('designsafe/apps/api/fixtures/agave_folder.json') as f:
#            af_json = json.load(f)
#
#        mock_af = mock.Mock(spec = AgaveFile)
#        mock_agave_from_file_path.return_value = mock_af
#        mock_esf = mock.Mock(spec = Object)
#        mock_object_from_file_path.return_value = mock_esf
#
#        with self.assertRaises(ApiException):
#            fm.move(file_id, FileManager.resource, dest_file_id)
#
#        self.assertFalse(mock_af.move.called)
#        self.assertFalse(mock_esf.move.called)
#
#    @mock.patch('designsafe.apps.api.data.agave.file.AgaveFile.to_dict')
#    @mock.patch('designsafe.apps.api.data.agave.elasticsearch.documents.Object.from_file_path')
#    @mock.patch.object(Object, 'move')
#    @mock.patch('designsafe.apps.api.data.agave.file.AgaveFile.move')
#    @mock.patch('designsafe.apps.api.data.agave.file.AgaveFile.from_file_path')
#    def test_move_file_different_resource_different_system(self, mock_agave_from_file_path, 
#        mock_agave_file_move, mock_object_move, mock_object_from_file_path, 
#        mock_agave_file_to_dict):
#        fm = self.get_filemanager()
#        
#        path = '%s/path/to/folder' % (self.user.username)
#        file_id = '%s/%s' % (settings.AGAVE_STORAGE_SYSTEM, path)
#        dest_path = '%s/path/to/another_folder' % (self.user.username)
#        dest_file_id = '%s/%s' % ('agave.different.system', dest_path)
#        
#        with open('designsafe/apps/api/fixtures/agave_folder.json') as f:
#            af_json = json.load(f)
#
#        mock_af = mock.Mock(spec = AgaveFile)
#        mock_agave_from_file_path.return_value = mock_af
#        mock_esf = mock.Mock(spec = Object)
#        mock_object_from_file_path.return_value = mock_esf
#
#        with self.assertRaises(ApiException):
#            fm.move(file_id, 'box', dest_file_id)
#
#        self.assertFalse(mock_af.move.called)
#        self.assertFalse(mock_esf.move.called)
#
#
#class FileManagerMoveToTrashTestCase(FileManagerBaseTestCase):
#    @mock.patch('designsafe.apps.api.data.agave.elasticsearch.documents.Object.from_file_path')
#    @mock.patch('designsafe.apps.api.data.agave.filemanager.FileManager.mkdir')
#    @mock.patch('designsafe.apps.api.data.agave.filemanager.FileManager.rename')
#    @mock.patch('designsafe.apps.api.data.agave.filemanager.FileManager.move')
#    def test_file_move_to_trash(self, mock_fm_move, mock_fm_rename, mock_fm_mkdir, 
#            mock_object_from_file_path):
#        fm = self.get_filemanager()
#
#        path = '%s/path/to/file.txt' % (self.user.username)
#        file_id = '%s/%s' % (settings.AGAVE_STORAGE_SYSTEM, path)
#
#        mock_esf = mock.Mock(spec = Object)
#        mock_object_from_file_path.side_effect = [mock_esf, None]
#        mock_fm_move.return_value = None
#        mock_fm_rename.return_value = None
#        mock_fm_mkdir.return_value = None
#
#        fm.move_to_trash(file_id)
#
#        object_from_file_path_calls = [
#            mock.call(settings.AGAVE_STORAGE_SYSTEM,
#                      self.user.username, '%s/.Trash' % (self.user.username)),
#            mock.call(settings.AGAVE_STORAGE_SYSTEM, self.user.username,
#                     '%s/.Trash/file.txt' % (self.user.username))]
#
#        mock_object_from_file_path.assert_has_calls(object_from_file_path_calls)
#        
#        mock_fm_move.assert_called_with(
#            file_id, fm.resource,
#            '%s/%s/.Trash' % (settings.AGAVE_STORAGE_SYSTEM, self.user.username))
# 
#    @mock.patch('designsafe.apps.api.data.agave.elasticsearch.documents.Object.from_file_path')
#    @mock.patch('designsafe.apps.api.data.agave.filemanager.FileManager.mkdir')
#    @mock.patch('designsafe.apps.api.data.agave.filemanager.FileManager.rename')
#    @mock.patch('designsafe.apps.api.data.agave.filemanager.FileManager.move')
#    def test_file_rename_and_move_to_trash(self, mock_fm_move, mock_fm_rename, mock_fm_mkdir, 
#            mock_object_from_file_path):
#        fm = self.get_filemanager()
#
#        path = '%s/path/to/file.txt' % (self.user.username)
#        file_id = '%s/%s' % (settings.AGAVE_STORAGE_SYSTEM, path)
#
#        mock_trash_esf = mock.Mock(spec=Object)
#        mock_conflict_file_esf = mock.Mock(spec=Object)
#        type(mock_conflict_file_esf).path = mock.PropertyMock(
#            return_value='%s/.Trash' % self.user.username)
#        type(mock_conflict_file_esf).name = mock.PropertyMock(return_value='file.txt')
#        mock_file_esf = mock.Mock(spec=Object)
#        type(mock_file_esf).type = mock.PropertyMock(return_value='file')
#        type(mock_file_esf).name = mock.PropertyMock(return_value='file.txt')
#        type(mock_file_esf).ext = mock.PropertyMock(return_value='.txt')
#        type(mock_file_esf).path = mock.PropertyMock(return_value='%s/path/to' % self.user.username)
#        type(mock_file_esf).full_path = mock.PropertyMock(return_value=path)
#
#        mock_object_from_file_path.side_effect = [mock_trash_esf,
#                                                  mock_conflict_file_esf,
#                                                  mock_file_esf,]
#
#        mock_fm_move.return_value = None
#        mock_fm_rename.return_value = {'id': file_id + '_timestamp'}
#        mock_fm_mkdir.return_value = None
#
#        fm.move_to_trash(file_id)
#
#        # calls:
#        # 1. check trash exists
#        # 2. check trash conflict
#        # 3. get file
#        # 4. rename file
#        # 5. move renamed file
#        object_from_file_path_calls = [
#            mock.call(settings.AGAVE_STORAGE_SYSTEM, self.user.username,
#                      '%s/.Trash' % (self.user.username)),
#            mock.call(settings.AGAVE_STORAGE_SYSTEM, self.user.username,
#                      '%s/.Trash/file.txt' % (self.user.username)),
#            mock.call(settings.AGAVE_STORAGE_SYSTEM, self.user.username, path),
#        ]
#
#        rename_calls = mock_fm_rename.call_args
#        ren_args, ren_kwargs = rename_calls
#        self.assertNotEqual(ren_args[1], 'file.txt')
#
#        mock_object_from_file_path.assert_has_calls(object_from_file_path_calls)
#
#        move_calls = mock_fm_move.call_args
#        mov_args, mov_kwargs = move_calls
#        self.assertTrue(mock_fm_move.called)
#        self.assertEqual(mov_args[0], file_id + '_timestamp')
#        self.assertEqual(mov_args[1], fm.resource)
#        self.assertNotEqual(mov_args[2], '%s/.Trash/file.txt')
#
#    @mock.patch('designsafe.apps.api.data.agave.elasticsearch.documents.Object.from_file_path')
#    @mock.patch('designsafe.apps.api.data.agave.filemanager.FileManager.mkdir')
#    @mock.patch('designsafe.apps.api.data.agave.filemanager.FileManager.rename')
#    @mock.patch('designsafe.apps.api.data.agave.filemanager.FileManager.move')
#    def test_folder_rename_and_move_to_trash(self, mock_fm_move, mock_fm_rename, mock_fm_mkdir, 
#            mock_object_from_file_path):
#        fm = self.get_filemanager()
#
#        path = '%s/path/to/folder' % (self.user.username)
#        file_id = '%s/%s' % (settings.AGAVE_STORAGE_SYSTEM, path)
#
#        mock_trash_esf = mock.Mock(spec = Object)
#        mock_conflict_file_esf = mock.Mock(spec=Object)
#        type(mock_conflict_file_esf).path = mock.PropertyMock(
#            return_value='%s/.Trash' % self.user.username)
#        type(mock_conflict_file_esf).name = 'folder'
#        mock_file_esf = mock.Mock(spec = Object)
#        type(mock_file_esf).type = mock.PropertyMock(return_value = 'dir')
#        type(mock_file_esf).name = mock.PropertyMock(return_value = 'folder')
#        type(mock_file_esf).path = mock.PropertyMock(return_value = '%s/path/to' % self.user.username)
#        type(mock_file_esf).full_path = mock.PropertyMock(return_value = path)
#        mock_file_esf.return_value.type = 'dir'
#        mock_object_from_file_path.side_effect = [mock_trash_esf, 
#                                                  mock_conflict_file_esf, 
#                                                  mock_file_esf]
#        mock_fm_move.return_value = None
#        mock_fm_rename.return_value = {'id': file_id + '_timestamp'}
#        mock_fm_mkdir.return_value = None
#
#        fm.move_to_trash(file_id)
#
#        # calls:
#        # 1. check trash exists
#        # 2. check trash conflict
#        # 3. get file
#        # 4. rename file
#        # 5. move renamed file
#        object_from_file_path_calls = [
#            mock.call(settings.AGAVE_STORAGE_SYSTEM, self.user.username,
#                      '%s/.Trash' % (self.user.username)),
#            mock.call(settings.AGAVE_STORAGE_SYSTEM, self.user.username,
#                      '%s/.Trash/folder' % (self.user.username)),
#            mock.call(settings.AGAVE_STORAGE_SYSTEM, self.user.username, path),
#        ]
#
#        rename_calls = mock_fm_rename.call_args
#        ren_args, ren_kwargs = rename_calls
#        self.assertNotEqual(ren_args[1], 'folder')
#
#        mock_object_from_file_path.assert_has_calls(object_from_file_path_calls)
#
#        move_calls = mock_fm_move.call_args
#        mov_args, mov_kwargs = move_calls
#        self.assertTrue(mock_fm_move.called)
#        self.assertEqual(mov_args[0], file_id + '_timestamp')
#        self.assertEqual(mov_args[1], fm.resource)
#        self.assertNotEqual(mov_args[2], '%s/.Trash/folder')
#
#
#class FileManagerPreviewTestCase(FileManagerBaseTestCase):
#    @mock.patch('designsafe.apps.api.data.agave.file.AgaveFile.from_file_path')
#    def test_preview_image_file(self, mock_agave_from_file_path):
#        fm = self.get_filemanager()
#            
#        path = '%s/path/to/img.png' % (self.user.username)
#        file_id = '%s/%s' % (settings.AGAVE_STORAGE_SYSTEM, path)
#        
#        mock_agave_file = mock.Mock(spec = AgaveFile)
#        type(mock_agave_file).name = mock.PropertyMock(return_value = 'img.png')
#        type(mock_agave_file).ext = mock.PropertyMock(return_value = '.png')
#        type(mock_agave_file).path = mock.PropertyMock(
#                    return_value = '%s/path/to' % self.user.username)
#                
#        mock_agave_from_file_path.return_value = mock_agave_file
#        mock_agave_file.create_postit.return_value = {'_links': {'self': {'href': 'download_link'} } }
#
#        fm.preview(file_id, format = 'html')
#        
#        mock_agave_file.create_postit.assert_called_with(force=False, lifetime=360)
#
#    @mock.patch('designsafe.apps.api.data.agave.file.AgaveFile.from_file_path')
#    def test_preview_text_file(self, mock_agave_from_file_path):
#        fm = self.get_filemanager()
#
#        path = '%s/path/to/text.txt' % (self.user.username)
#        file_id = '%s/%s' % (settings.AGAVE_STORAGE_SYSTEM, path)
#
#        mock_agave_file = mock.Mock(autospec = AgaveFile)
#        type(mock_agave_file).name = mock.PropertyMock(return_value = 'preview_file_a.txt')
#        type(mock_agave_file).ext = mock.PropertyMock(return_value = '.txt')
#        type(mock_agave_file).path = mock.PropertyMock(
#            return_value = '%s/path/to' % self.user.username)
#
#        mock_agave_from_file_path.return_value = mock_agave_file
#
#        preview_fixture = 'designsafe/apps/api/fixtures/preview_file_a.txt'
#        with open(preview_fixture) as f:
#            mock_agave_file.download.return_value = f.read()
#
#        fm.preview(file_id, format='html')
#
#        preview_tmpl, preview_context = fm.preview(file_id, format='html')
#
#        self.assertTrue(mock_agave_file.download.called)
#        self.assertIn('text_preview', preview_context)
#        self.assertIn('Belford bridge', preview_context['text_preview'])
#
#    @mock.patch('designsafe.apps.api.data.agave.file.AgaveFile.from_file_path')
#    def test_preview_text_file_windows_encoding(self, mock_agave_from_file_path):
#        fm = self.get_filemanager()
#
#        path = '%s/path/to/text.txt' % (self.user.username)
#        file_id = '%s/%s' % (settings.AGAVE_STORAGE_SYSTEM, path)
#
#        mock_agave_file = mock.Mock(autospec = AgaveFile)
#        type(mock_agave_file).name = mock.PropertyMock(return_value = 'preview_file_b.txt')
#        type(mock_agave_file).ext = mock.PropertyMock(return_value = '.txt')
#        type(mock_agave_file).path = mock.PropertyMock(
#            return_value = '%s/path/to' % self.user.username)
#
#        mock_agave_from_file_path.return_value = mock_agave_file
#
#        preview_fixture = 'designsafe/apps/api/fixtures/preview_file_b.txt'
#        with open(preview_fixture) as f:
#            mock_agave_file.download.return_value = f.read()
#
#        preview_tmpl, preview_context = fm.preview(file_id, format='html')
#
#        self.assertTrue(mock_agave_file.download.called)
#        self.assertIn('text_preview', preview_context)
#        self.assertIn('Belford bridge', preview_context['text_preview'])
#
#    @mock.patch('designsafe.apps.api.data.agave.file.AgaveFile.from_file_path')
#    def test_preview_object_file(self, mock_agave_from_file_path):
#        fm = self.get_filemanager()
#
#        path = '%s/path/to/doc.pdf' % (self.user.username)
#        file_id = '%s/%s' % (settings.AGAVE_STORAGE_SYSTEM, path)
#
#        mock_agave_file = mock.Mock(autospec = AgaveFile)
#        type(mock_agave_file).name = mock.PropertyMock(return_value = 'doc.pdf')
#        type(mock_agave_file).ext = mock.PropertyMock(return_value = '.pdf')
#        type(mock_agave_file).path = mock.PropertyMock(
#                    return_value = '%s/path/to' % self.user.username)
#        
#        mock_agave_from_file_path.return_value = mock_agave_file
#        mock_agave_file.create_postit.return_value = {'_links': {'self': {'href': 'download_link'} } }
#
#        fm.preview(file_id, format = 'html')
#
#        mock_agave_file.create_postit.assert_called_with(force=False)
#
#    @mock.patch('designsafe.apps.api.data.agave.file.AgaveFile.from_file_path')
#    def test_preview_object_file(self, mock_agave_from_file_path):
#        fm = self.get_filemanager()
#
#        path = '%s/path/to/doc.asdf' % (self.user.username)
#        file_id = '%s/%s' % (settings.AGAVE_STORAGE_SYSTEM, path)
#
#        mock_agave_file = mock.Mock(autospec = AgaveFile)
#        type(mock_agave_file).name = mock.PropertyMock(return_value = 'doc.asdf')
#        type(mock_agave_file).ext = mock.PropertyMock(return_value = '.asdf')
#        type(mock_agave_file).path = mock.PropertyMock(
#                    return_value = '%s/path/to' % self.user.username)
#        
#        mock_agave_from_file_path.return_value = mock_agave_file
#
#        fm.preview(file_id, format = 'html')
#
#        self.assertFalse(mock_agave_file.create_postit.called)
#
#class FileManagerMkdirTestCase(FileManagerBaseTestCase):
#    @mock.patch('designsafe.apps.api.data.agave.elasticsearch.documents.Object.from_agave_file')
#    @mock.patch('designsafe.apps.api.data.agave.file.AgaveFile.mkdir')
#    def test_mkdir(self, mock_agave_mkdir,
#                                mock_object_from_agave_file):
#        fm = self.get_filemanager()
#
#        path = '%s/path/to/folder' % (self.user.username)
#        file_id = '%s/%s' % (settings.AGAVE_STORAGE_SYSTEM, path)
#        dir_name = 'new_dir'
#        system = str(settings.AGAVE_STORAGE_SYSTEM)
#
#        mock_af = mock.Mock(spec = AgaveFile)
#        mock_esf = mock.Mock(spec = Object)
#
#        mock_agave_mkdir.return_value = mock_af
#        mock_object_from_agave_file.return_value = mock_esf
#
#        fm.mkdir(file_id, dir_name)
#
#        mock_agave_mkdir.assert_called_with(
#            system, self.user.username, path, dir_name, agave_client=fm.agave_client)
#        mock_object_from_agave_file.assert_called_with(
#            self.user.username, mock_af, get_pems=True)
#
#class FileManagerRenameTestCase(FileManagerBaseTestCase):
#    @mock.patch('designsafe.apps.api.data.agave.elasticsearch.documents.Object.from_file_path')        
#    @mock.patch('designsafe.apps.api.data.agave.file.AgaveFile.from_file_path')        
#    def test_rename(self, mock_agave_from_file_path, mock_object_from_file_path):
#        fm = self.get_filemanager()
#
#        path = '%s/path/to/folder' % (self.user.username)
#        file_id = '%s/%s' % (settings.AGAVE_STORAGE_SYSTEM, path)
#        target_name = 'new_name'
#
#        mock_af = mock.Mock(spec = AgaveFile)
#        mock_esf = mock.Mock(spec = Object)
#
#        mock_agave_from_file_path.return_value = mock_af
#        mock_object_from_file_path.return_value = mock_esf
#
#        fm.rename(file_id, target_name)
#
#        mock_agave_from_file_path.assert_called_with(settings.AGAVE_STORAGE_SYSTEM,
#                        self.user.username, path, agave_client = fm.agave_client)
#        mock_object_from_file_path.assert_called_with(settings.AGAVE_STORAGE_SYSTEM,
#                        self.user.username, path)
#        mock_af.rename.assert_called_with(target_name)
#        mock_esf.rename.assert_called_with(self.user.username, target_name)
#
#
#class FileManagerShareTestCase(FileManagerBaseTestCase):
#    @mock.patch('designsafe.apps.api.tasks.share_agave.apply_async')
#    @mock.patch('designsafe.apps.api.data.agave.file.AgaveFile.from_file_path')
#    def test_rename(self, mock_agave_from_file_path, mock_share_task):
#        fm = self.get_filemanager()
#
#        path = '%s/path/to/folder' % (self.user.username)
#        file_id = '%s/%s' % (settings.AGAVE_STORAGE_SYSTEM, path)
#        permissions = [{'user_to_share': 'share_user', 'permission': 'READ'}]
#
#        mock_af = mock.Mock(spec = AgaveFile)
#
#        mock_agave_from_file_path.return_value = mock_af
#
#        fm.share(file_id, permissions)
#
#        mock_agave_from_file_path.assert_called_with(
#            settings.AGAVE_STORAGE_SYSTEM,
#            self.user.username, path,
#            agave_client=fm.agave_client)
#        mock_share_task.assert_called_with(
#            args=(self.user.username, file_id, permissions, True), queue='indexing')
#

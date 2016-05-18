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

class FileManagerBaseTestCase(TestCase):
    fixtures = ['user-data.json', 'agave-oauth-token-data.json']

    def setUp(self):
        user = get_user_model().objects.get(pk=2)
        user.set_password('password')
        user.save()
        self.user = user

    @mock.patch('agavepy.agave.Agave.__init__')
    @mock.patch('designsafe.apps.auth.models.AgaveOAuthToken.refresh')
    def get_filemanager(self, agave_oauth_refresh, agave_init):
        agave_init.return_value = None
        agave_oauth_refresh.return_value = None
        fm = FileManager(self.user)
        return fm

class FileManagerTestCase(FileManagerBaseTestCase):
    @mock.patch('agavepy.agave.Agave.__init__')
    @mock.patch('designsafe.apps.auth.models.AgaveOAuthToken.refresh')
    def test_filemanager_initialization(self, agave_oauth_refresh, agave_init):
        """Test correct FileManager initialization

        Asserts:
        --------

            * Agave client gets called with the correct args
            * Username is correctly set
        """
        agave_init.return_value = None
        agave_oauth_refresh.return_value = None
        fm = FileManager(self.user)
        agave_init.assert_called_with(api_server = settings.AGAVE_TENANT_BASEURL,
                                   token = self.user.agave_oauth.access_token)
        self.assertEqual(fm.username, self.user.username)

    def test_is_shared(self):
        """Test if a file is shared with a user

        Asserts:
        --------
            
            * If folder is shared
            * If file is shared
        """
        fm = self.get_filemanager()
        folder_not_shared = fm.is_shared('%s/%s/folder' % (settings.AGAVE_STORAGE_SYSTEM, self.user.username))
        self.assertEqual(folder_not_shared, False)

        file_not_shared = fm.is_shared('%s/%s/folder/file.txt' % (settings.AGAVE_STORAGE_SYSTEM, self.user.username))
        self.assertEqual(file_not_shared, False)

        folder_is_shared = fm.is_shared('%s/%s/folder' % (settings.AGAVE_STORAGE_SYSTEM, 'another_username'))
        self.assertEqual(folder_is_shared, True)

        file_is_shared = fm.is_shared('%s/%s/folder/file.txt' % (settings.AGAVE_STORAGE_SYSTEM, 'another_username'))
        self.assertEqual(file_is_shared, True)

    def test_folder_parse_file_id(self):
        fm = self.get_filemanager()
        path = '%s/path/to/folder' % (self.user.username)
        file_id = '%s/%s' % (settings.AGAVE_STORAGE_SYSTEM, path)

        system, file_user, file_path = fm.parse_file_id(file_id)

        self.assertEqual(system, settings.AGAVE_STORAGE_SYSTEM)
        self.assertEqual(file_user, self.user.username)
        self.assertEqual(file_path, path)

    def test_file_parse_file_id(self):
        fm = self.get_filemanager()

        path = '%s/path/to/file.txt' % (self.user.username)
        file_id = '%s/%s' % (settings.AGAVE_STORAGE_SYSTEM, path)

        system, file_user, file_path = fm.parse_file_id(file_id)

        self.assertEqual(system, settings.AGAVE_STORAGE_SYSTEM)
        self.assertEqual(file_user, self.user.username)
        self.assertEqual(file_path, path)

    def test_default_parse_file_id(self):
        fm = self.get_filemanager()
        system, file_user, file_path = fm.parse_file_id('')

        self.assertEqual(system, settings.AGAVE_STORAGE_SYSTEM)
        self.assertEqual(file_user, self.user.username)
        self.assertEqual(file_path, self.user.username)

class FileManagerListingTestCase(FileManagerBaseTestCase):
    @mock.patch('designsafe.apps.api.data.agave.filemanager.FileManager._agave_listing')
    @mock.patch.object(FileManager, '_es_listing')
    def test_listing_agave_fallback(self, mock_es_listing, mock_agave_listing):
        fm = self.get_filemanager()
        
        path = '%s/path/to/folder' % (self.user.username)
        file_id = '%s/%s' % (settings.AGAVE_STORAGE_SYSTEM, path)

        mock_es_listing.return_value = []
        
        fm.listing(file_id)
        
        mock_agave_listing.assert_called_with(settings.AGAVE_STORAGE_SYSTEM, path)

    @mock.patch('designsafe.apps.api.data.agave.filemanager.FileManager._es_listing')
    def test_listing_es(self, mock_es_listing):
        fm = self.get_filemanager()
        
        path = '%s/path/to/folder' % (self.user.username)
        file_id = '%s/%s' % (settings.AGAVE_STORAGE_SYSTEM, path)

        fm.listing(file_id)
        
        mock_es_listing.assert_called_with(settings.AGAVE_STORAGE_SYSTEM, self.user.username, path)

class FileManagerDownloadTestCase(FileManagerBaseTestCase):
    @mock.patch('designsafe.apps.api.data.agave.file.AgaveFile.from_file_path')
    @mock.patch('designsafe.apps.api.data.agave.file.AgaveFile.create_postit')
    def test_file_download(self, mock_agave_create_postit, mock_agave_from_file_path):
        fm = self.get_filemanager()
        
        path = '%s/path/to/folder' % (self.user.username)
        file_id = '%s/%s' % (settings.AGAVE_STORAGE_SYSTEM, path)
        
        with open('designsafe/apps/api/fixtures/agave_file.json') as f:
            af_json = json.load(f)
        
        af = AgaveFile(wrap = af_json[0])
        mock_agave_from_file_path.return_value = af

        download_link = fm.download(file_id)

        mock_agave_from_file_path.assert_called_with(settings.AGAVE_STORAGE_SYSTEM, self.user.username, path, agave_client = fm.agave_client)
        
        mock_agave_create_postit.assert_called_with(force = True)

    @mock.patch('designsafe.apps.api.data.agave.file.AgaveFile.from_file_path')
    @mock.patch('designsafe.apps.api.data.agave.file.AgaveFile.create_postit')
    def test_folder_download(self, mock_agave_create_postit, mock_agave_from_file_path):
        fm = self.get_filemanager()
        
        path = '%s/path/to/folder' % (self.user.username)
        file_id = '%s/%s' % (settings.AGAVE_STORAGE_SYSTEM, path)
        
        with open('designsafe/apps/api/fixtures/agave_folder.json') as f:
            af_json = json.load(f)
        
        af = AgaveFile(wrap = af_json[0])
        mock_agave_from_file_path.return_value = af

        download_link = fm.download(file_id)

        mock_agave_from_file_path.assert_called_with(settings.AGAVE_STORAGE_SYSTEM, self.user.username, path, agave_client = fm.agave_client)
        
        self.assertFalse(mock_agave_create_postit.called, 
                'Should not create postit for folders')

class FileManagerMoveTestCase(FileManagerBaseTestCase):
    @mock.patch('designsafe.apps.api.data.agave.file.AgaveFile.to_dict')
    @mock.patch.object(Object, 'from_file_path')
    @mock.patch.object(Object, 'move')
    @mock.patch('designsafe.apps.api.data.agave.file.AgaveFile.move')
    @mock.patch('designsafe.apps.api.data.agave.file.AgaveFile.from_file_path')
    def test_move_file(self, mock_agave_from_file_path, mock_agave_file_move, 
        mock_object_move, mock_object_from_file_path, mock_agave_file_to_dict):
        fm = self.get_filemanager()
        
        path = '%s/path/to/folder' % (self.user.username)
        file_id = '%s/%s' % (settings.AGAVE_STORAGE_SYSTEM, path)
        dest_path = '%s/path/to/another_folder' % (self.user.username)
        dest_file_id = '%s/%s' % (settings.AGAVE_STORAGE_SYSTEM, dest_path)
        
        with open('designsafe/apps/api/fixtures/agave_folder.json') as f:
            af_json = json.load(f)
      
        mock_af = mock.Mock(spec = AgaveFile)
        mock_agave_from_file_path.return_value = mock_af
        mock_esf = mock.Mock(spec = Object)
        mock_object_from_file_path.return_value = mock_esf

        fm.move(file_id, fm.resource, dest_file_id)

        mock_agave_from_file_path.assert_called_with(settings.AGAVE_STORAGE_SYSTEM,
                  self.user.username, path, agave_client = fm.agave_client)
        mock_af.move.assert_called_with(dest_path)

        mock_object_from_file_path.assert_called_with(settings.AGAVE_STORAGE_SYSTEM,
                            self.user.username, path)
        mock_esf.move.assert_called_with(self.user.username, dest_path)

    @mock.patch('designsafe.apps.api.data.agave.file.AgaveFile.to_dict')
    @mock.patch('designsafe.apps.api.data.agave.elasticsearch.documents.Object.from_file_path')
    @mock.patch.object(Object, 'move')
    @mock.patch('designsafe.apps.api.data.agave.file.AgaveFile.move')
    @mock.patch('designsafe.apps.api.data.agave.file.AgaveFile.from_file_path')
    def test_move_file_same_resource_different_system(self, mock_agave_from_file_path, 
        mock_agave_file_move, mock_object_move, mock_object_from_file_path, 
        mock_agave_file_to_dict):
        fm = self.get_filemanager()
        
        path = '%s/path/to/folder' % (self.user.username)
        file_id = '%s/%s' % (settings.AGAVE_STORAGE_SYSTEM, path)
        dest_path = '%s/path/to/another_folder' % (self.user.username)
        dest_file_id = '%s/%s' % ('agave.different.system', dest_path)
        
        with open('designsafe/apps/api/fixtures/agave_folder.json') as f:
            af_json = json.load(f)

        mock_af = mock.Mock(spec = AgaveFile)
        mock_agave_from_file_path.return_value = mock_af
        mock_esf = mock.Mock(spec = Object)
        mock_object_from_file_path.return_value = mock_esf

        with self.assertRaises(ApiException):
            fm.move(file_id, FileManager.resource, dest_file_id)

        self.assertFalse(mock_af.move.called)
        self.assertFalse(mock_esf.move.called)

    @mock.patch('designsafe.apps.api.data.agave.file.AgaveFile.to_dict')
    @mock.patch('designsafe.apps.api.data.agave.elasticsearch.documents.Object.from_file_path')
    @mock.patch.object(Object, 'move')
    @mock.patch('designsafe.apps.api.data.agave.file.AgaveFile.move')
    @mock.patch('designsafe.apps.api.data.agave.file.AgaveFile.from_file_path')
    def test_move_file_different_resource_different_system(self, mock_agave_from_file_path, 
        mock_agave_file_move, mock_object_move, mock_object_from_file_path, 
        mock_agave_file_to_dict):
        fm = self.get_filemanager()
        
        path = '%s/path/to/folder' % (self.user.username)
        file_id = '%s/%s' % (settings.AGAVE_STORAGE_SYSTEM, path)
        dest_path = '%s/path/to/another_folder' % (self.user.username)
        dest_file_id = '%s/%s' % ('agave.different.system', dest_path)
        
        with open('designsafe/apps/api/fixtures/agave_folder.json') as f:
            af_json = json.load(f)

        mock_af = mock.Mock(spec = AgaveFile)
        mock_agave_from_file_path.return_value = mock_af
        mock_esf = mock.Mock(spec = Object)
        mock_object_from_file_path.return_value = mock_esf

        with self.assertRaises(ApiException):
            fm.move(file_id, 'box', dest_file_id)

        self.assertFalse(mock_af.move.called)
        self.assertFalse(mock_esf.move.called)

class FileManagerMoveToTrashTestCase(FileManagerBaseTestCase):
    @mock.patch('designsafe.apps.api.data.agave.elasticsearch.documents.Object.from_file_path')
    @mock.patch('designsafe.apps.api.data.agave.filemanager.FileManager.mkdir')
    @mock.patch('designsafe.apps.api.data.agave.filemanager.FileManager.rename')
    @mock.patch('designsafe.apps.api.data.agave.filemanager.FileManager.move')
    def test_file_move_to_trash(self, mock_fm_move, mock_fm_rename, mock_fm_mkdir, 
            mock_object_from_file_path):
        fm = self.get_filemanager()

        path = '%s/path/to/file.txt' % (self.user.username)
        file_id = '%s/%s' % (settings.AGAVE_STORAGE_SYSTEM, path)

        mock_esf = mock.Mock(spec = Object)
        mock_object_from_file_path.side_effect = [mock_esf, None]
        mock_fm_move.return_value = None
        mock_fm_rename.return_value = None
        mock_fm_mkdir.return_value = None

        fm.move_to_trash(file_id)

        object_from_file_path_calls = [mock.call(settings.AGAVE_STORAGE_SYSTEM,
                self.user.username, '%s/.Trash' % (self.user.username)),
                mock.call(settings.AGAVE_STORAGE_SYSTEM, self.user.username,
                '%s/.Trash/file.txt' % (self.user.username))]

        mock_object_from_file_path.assert_has_calls(object_from_file_path_calls)
        
        mock_fm_move.assert_called_with(file_id, fm.resource, '%s/%s/.Trash/file.txt' % (settings.AGAVE_STORAGE_SYSTEM, self.user.username))
 
    @mock.patch('designsafe.apps.api.data.agave.elasticsearch.documents.Object.from_file_path')
    @mock.patch('designsafe.apps.api.data.agave.filemanager.FileManager.mkdir')
    @mock.patch('designsafe.apps.api.data.agave.filemanager.FileManager.rename')
    @mock.patch('designsafe.apps.api.data.agave.filemanager.FileManager.move')
    def test_file_rename_and_move_to_trash(self, mock_fm_move, mock_fm_rename, mock_fm_mkdir, 
            mock_object_from_file_path):
        fm = self.get_filemanager()

        path = '%s/path/to/file.txt' % (self.user.username)
        file_id = '%s/%s' % (settings.AGAVE_STORAGE_SYSTEM, path)

        mock_trash_esf = mock.Mock(spec = Object)
        mock_file_esf = mock.Mock(spec = Object)
        type(mock_file_esf).type = mock.PropertyMock(return_value = 'file')
        type(mock_file_esf).name = mock.PropertyMock(return_value = 'file.txt')
        type(mock_file_esf).ext = mock.PropertyMock(return_value = '.txt')
        type(mock_file_esf).path = mock.PropertyMock(return_value = '%s/path/to' % self.user.username)
        type(mock_file_esf).full_path = mock.PropertyMock(return_value = path)
        mock_object_from_file_path.side_effect = [mock_trash_esf, mock_file_esf]
        mock_fm_move.return_value = None
        mock_fm_rename.return_value = None
        mock_fm_mkdir.return_value = None

        fm.move_to_trash(file_id)

        object_from_file_path_calls = [mock.call(settings.AGAVE_STORAGE_SYSTEM,
                self.user.username, '%s/.Trash' % (self.user.username)),
                mock.call(settings.AGAVE_STORAGE_SYSTEM, self.user.username,
                '%s/.Trash/file.txt' % (self.user.username))]

        rename_calls = mock_fm_rename.call_args
        ren_args, ren_kwargs = rename_calls
        self.assertNotEqual(ren_args[1], 'file.txt')

        mock_object_from_file_path.assert_has_calls(object_from_file_path_calls)

        move_calls = mock_fm_move.call_args
        mov_args, mov_kwargs = move_calls
        self.assertTrue(mock_fm_move.called)
        self.assertEqual(mov_args[0], file_id)
        self.assertEqual(mov_args[1], fm.resource)
        self.assertNotEqual(mov_args[2], '%s/.Trash/file.txt')

    @mock.patch('designsafe.apps.api.data.agave.elasticsearch.documents.Object.from_file_path')
    @mock.patch('designsafe.apps.api.data.agave.filemanager.FileManager.mkdir')
    @mock.patch('designsafe.apps.api.data.agave.filemanager.FileManager.rename')
    @mock.patch('designsafe.apps.api.data.agave.filemanager.FileManager.move')
    def test_folder_rename_and_move_to_trash(self, mock_fm_move, mock_fm_rename, mock_fm_mkdir, 
            mock_object_from_file_path):
        fm = self.get_filemanager()

        path = '%s/path/to/folder' % (self.user.username)
        file_id = '%s/%s' % (settings.AGAVE_STORAGE_SYSTEM, path)

        mock_trash_esf = mock.Mock(spec = Object)
        mock_file_esf = mock.Mock(spec = Object)
        type(mock_file_esf).type = mock.PropertyMock(return_value = 'dir')
        type(mock_file_esf).name = mock.PropertyMock(return_value = 'folder')
        type(mock_file_esf).path = mock.PropertyMock(return_value = '%s/path/to' % self.user.username)
        type(mock_file_esf).full_path = mock.PropertyMock(return_value = path)
        mock_file_esf.return_value.type = 'dir'
        mock_object_from_file_path.side_effect = [mock_trash_esf, mock_file_esf]
        mock_fm_move.return_value = None
        mock_fm_rename.return_value = None
        mock_fm_mkdir.return_value = None

        fm.move_to_trash(file_id)

        object_from_file_path_calls = [mock.call(settings.AGAVE_STORAGE_SYSTEM,
                self.user.username, '%s/.Trash' % (self.user.username)),
                mock.call(settings.AGAVE_STORAGE_SYSTEM, self.user.username,
                '%s/.Trash/folder' % (self.user.username))]

        rename_calls = mock_fm_rename.call_args
        ren_args, ren_kwargs = rename_calls
        self.assertNotEqual(ren_args[1], 'folder')

        mock_object_from_file_path.assert_has_calls(object_from_file_path_calls)

        move_calls = mock_fm_move.call_args
        mov_args, mov_kwargs = move_calls
        self.assertTrue(mock_fm_move.called)
        self.assertEqual(mov_args[0], file_id)
        self.assertEqual(mov_args[1], fm.resource)
        self.assertNotEqual(mov_args[2], '%s/.Trash/folder')

from django.test import TestCase
from django.contrib.auth import get_user_model
from django.conf import settings
from designsafe.apps.api.data.agave.filemanager import FileManager
from designsafe.apps.api.data.agave.elasticsearch.documents import Object
from designsafe.apps.auth.models import AgaveOAuthToken
from agavepy.agave import Agave
import mock

class FileManagerBaseTestCase(TestCase):
    fixtures = ['user-data.json', 'agave-oauth-token-data.json']

    def setUp(self):
        user = get_user_model().objects.get(pk=2)
        user.set_password('password')
        user.save()
        self.user = user

    @mock.patch('agavepy.agave.Agave.__init__')
    @mock.patch('designsafe.apps.auth.models.AgaveOAuthToken.refresh')
    def get_filemanager(self, agave_init, agave_oauth_refresh):
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


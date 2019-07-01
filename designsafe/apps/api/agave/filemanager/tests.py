import os
import json
import datetime
from mock import patch, MagicMock
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.conf import settings
from datetime import timedelta
from designsafe.apps.api.agave.filemanager.lookups import FileLookupManager

from designsafe.apps.api.agave.filemanager.private_data import PrivateDataFileManager
from designsafe.apps.api.agave.filemanager.community import CommunityFileManager
from designsafe.apps.api.agave.filemanager.published_files import PublishedFileManager
from designsafe.apps.api.agave.filemanager.shared_data import SharedDataFileManager
from designsafe.apps.api.agave.filemanager.publications import PublicationsManager

from designsafe.apps.data.models.elasticsearch import IndexedPublication, IndexedPublicationLegacy

from designsafe.apps.api.exceptions import ApiException

class TestLookupManager(TestCase):

    def test_lookup_returns_for_shared(self):
        self.assertEqual(FileLookupManager('shared'), SharedDataFileManager)
    def test_lookup_returns_for_private(self):
        self.assertEqual(FileLookupManager('agave'), PrivateDataFileManager)
    def test_lookup_returns_for_publications(self):
        self.assertEqual(FileLookupManager('public'), PublicationsManager)
    def test_lookup_returns_for_published_files(self):
        self.assertEqual(FileLookupManager('published'), PublishedFileManager)
    def test_lookup_returns_for_community(self):
        self.assertEqual(FileLookupManager('community'), CommunityFileManager)

class TestPrivateDataManager(TestCase):
    def test_requires_auth(self):
        mock_ac = MagicMock()
        fm = PrivateDataFileManager(mock_ac)
        self.assertEqual(fm.requires_auth, True) 

class TestCommunityFileManager(TestCase):
    @patch('designsafe.apps.api.agave.filemanager.agave.BaseFileResource')
    def test_listing(self, mock_afm):
        mock_ac = MagicMock()
        fm = CommunityFileManager(mock_ac)
        fm.listing('test.system', '/')
        mock_afm.listing.assert_called_with(mock_ac, 'test.system', '/', 0, 100)
    def test_requires_auth(self):
        mock_ac = MagicMock()
        fm = CommunityFileManager(mock_ac)
        self.assertEqual(fm.requires_auth, False) 
    def test_copy_raises(self):
        mock_ac = MagicMock()
        fm = CommunityFileManager(mock_ac)
        with self.assertRaises(ApiException):
            fm.copy()
    def test_delete_raises(self):
        mock_ac = MagicMock()
        fm = CommunityFileManager(mock_ac)
        with self.assertRaises(ApiException):
            fm.delete()
    def test_mkdir_raises(self):
        mock_ac = MagicMock()
        fm = CommunityFileManager(mock_ac)
        with self.assertRaises(ApiException):
            fm.mkdir()
    def test_move_raises(self):
        mock_ac = MagicMock()
        fm = CommunityFileManager(mock_ac)
        with self.assertRaises(ApiException):
            fm.move()
    def test_rename_raises(self):
        mock_ac = MagicMock()
        fm = CommunityFileManager(mock_ac)
        with self.assertRaises(ApiException):
            fm.rename()
    def test_share_raises(self):
        mock_ac = MagicMock()
        fm = CommunityFileManager(mock_ac)
        with self.assertRaises(ApiException):
            fm.share()
    def test_trash_raises(self):
        mock_ac = MagicMock()
        fm = CommunityFileManager(mock_ac)
        with self.assertRaises(ApiException):
            fm.trash()
    def test_upload_raises(self):
        mock_ac = MagicMock()
        fm = CommunityFileManager(mock_ac)
        with self.assertRaises(ApiException):
            fm.upload()

class TestPublishedFileManager(TestCase):
    @patch('designsafe.apps.api.agave.filemanager.agave.BaseFileResource')
    def test_listing(self, mock_afm):
        mock_ac = MagicMock()
        fm = PublishedFileManager(mock_ac)
        fm.listing('test.system', '/')
        mock_afm.listing.assert_called_with(mock_ac, 'test.system', '/', 0, 100)
    def test_requires_auth(self):
        mock_ac = MagicMock()
        fm = PublishedFileManager(mock_ac)
        self.assertEqual(fm.requires_auth, False) 
    def test_delete_raises(self):
        mock_ac = MagicMock()
        fm = PublishedFileManager(mock_ac)
        with self.assertRaises(ApiException):
            fm.delete()
    def test_mkdir_raises(self):
        mock_ac = MagicMock()
        fm = PublishedFileManager(mock_ac)
        with self.assertRaises(ApiException):
            fm.mkdir()
    def test_move_raises(self):
        mock_ac = MagicMock()
        fm = PublishedFileManager(mock_ac)
        with self.assertRaises(ApiException):
            fm.move()
    def test_rename_raises(self):
        mock_ac = MagicMock()
        fm = PublishedFileManager(mock_ac)
        with self.assertRaises(ApiException):
            fm.rename()
    def test_share_raises(self):
        mock_ac = MagicMock()
        fm = PublishedFileManager(mock_ac)
        with self.assertRaises(ApiException):
            fm.share()
    def test_trash_raises(self):
        mock_ac = MagicMock()
        fm = PublishedFileManager(mock_ac)
        with self.assertRaises(ApiException):
            fm.trash()
    def test_upload_raises(self):
        mock_ac = MagicMock()
        fm = PublishedFileManager(mock_ac)
        with self.assertRaises(ApiException):
            fm.upload()

class TestPublicationsManager(TestCase):
    def test_requires_auth(self):
        mock_ac = MagicMock()
        fm = PublicationsManager(mock_ac)
        self.assertEqual(fm.requires_auth, False) 

    @patch('designsafe.apps.api.agave.filemanager.publications.BaseESPublicationLegacy')
    @patch('designsafe.apps.api.agave.filemanager.publications.BaseESPublication')
    @patch('designsafe.apps.api.agave.filemanager.publications.Search')
    def test_listing(self, mock_search, mock_pub, mock_leg_pub):
        fm = PublicationsManager(None) 
        mock_search().query().sort().extra().execute.return_value = [
            IndexedPublication(projectId='PRJ-XXX'),
            IndexedPublicationLegacy()
        ]

        mock_pub().to_file.return_value = {'type': 'pub'}
        mock_leg_pub().to_file.return_value = {'type': 'leg_pub'}

        res = fm.listing()
        expected_result = {
            'trail': [{'name': '$SEARCH', 'path': '/$SEARCH'}],
            'name': '$SEARCH',
            'path': '/',
            'system': None,
            'type': 'dir',
            'children': [{'type': 'pub'}, {'type': 'leg_pub'}],
            'permissions': 'READ'
        }
        self.assertEqual(res, expected_result)

    @patch('designsafe.apps.api.agave.filemanager.publications.BaseESPublication')
    def test_save(self, mock_pub):
        from designsafe.apps.api.agave.filemanager.fixtures.publication_fixture import pub_fixture
        fm = PublicationsManager(None) 
        mock_saved_pub = MagicMock()
        mock_pub.return_value = mock_saved_pub
        pub = fm.save_publication(pub_fixture)
        self.assertEqual(pub, mock_saved_pub)
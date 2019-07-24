import os
import json
import datetime
from mock import patch, MagicMock
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.conf import settings
from datetime import timedelta
from elasticsearch_dsl import Search 

from designsafe.apps.api.search.searchmanager.lookups import SearchLookupManager

from designsafe.apps.api.search.searchmanager.private_data import PrivateDataSearchManager
from designsafe.apps.api.search.searchmanager.community import CommunityDataSearchManager
from designsafe.apps.api.search.searchmanager.published_files import PublishedDataSearchManager
from designsafe.apps.api.search.searchmanager.shared_data import SharedDataSearchManager
from designsafe.apps.api.search.searchmanager.publications import PublicationsSearchManager

from designsafe.apps.data.models.elasticsearch import IndexedPublication, IndexedPublicationLegacy
from designsafe.apps.data.models.elasticsearch import IndexedFile

from designsafe.apps.api.exceptions import ApiException

class TestLookupManager(TestCase):

    def test_lookup_returns_for_shared(self):
        self.assertEqual(SearchLookupManager('shared'), SharedDataSearchManager)
    def test_lookup_returns_for_private(self):
        self.assertEqual(SearchLookupManager('agave'), PrivateDataSearchManager)
    def test_lookup_returns_for_publications(self):
        self.assertEqual(SearchLookupManager('public'), PublicationsSearchManager)
    def test_lookup_returns_for_published_files(self):
        self.assertEqual(SearchLookupManager('published'), PublishedDataSearchManager)
    def test_lookup_returns_for_community(self):
        self.assertEqual(SearchLookupManager('community'), CommunityDataSearchManager)

class TestPrivateDataSearchMgr(TestCase):
    @patch('designsafe.apps.api.search.searchmanager.private_data.BaseSearchManager.__init__')
    def test_init(self, mock_base):
        request = MagicMock()
        request.query_string = 'test_query'
        request.username = 'test_user'

        sm = PrivateDataSearchManager(request)
        mock_base.assert_called_with(IndexedFile, IndexedFile.search())

    @patch('designsafe.apps.api.search.searchmanager.private_data.BaseSearchManager.__init__')
    @patch('designsafe.apps.api.search.searchmanager.private_data.Search')
    def test_search(self, mock_search, mock_base):
        request = MagicMock()
        request.query_string = 'test_query'
        request.username = 'test_user'

        mock_res = MagicMock()
        mock_res.hits.total = 1
        mock_res.__iter__.return_value = [IndexedFile(name='file01')] 

        mock_search().query().extra().execute.return_value = mock_res

        sm = PrivateDataSearchManager(request)
        expected_result = {
            'trail': [{'name': '$SEARCH', 'path': '/$SEARCH'}],
            'name': '$SEARCH',
            'path': '/',
            'system': 'test.system',
            'type': 'dir',
            'children': [{'name': 'file01'}],
            'permissions': 'READ'
        }
        listing = sm.listing('test.system', '/')
        self.assertEqual(listing, expected_result)

class TestCommunitySearchMgr(TestCase):
    @patch('designsafe.apps.api.search.searchmanager.community.BaseSearchManager.__init__')
    def test_init(self, mock_base):
        request = MagicMock()
        request.query_string = 'test_query'
        request.username = 'test_user'

        sm = CommunityDataSearchManager(request)
        mock_base.assert_called_with(IndexedFile, IndexedFile.search())

    @patch('designsafe.apps.api.search.searchmanager.community.BaseSearchManager.__init__')
    @patch('designsafe.apps.api.search.searchmanager.community.Search')
    def test_search(self, mock_search, mock_base):
        request = MagicMock()
        request.query_string = 'test_query'
        request.username = 'test_user'

        mock_res = MagicMock()
        mock_res.hits.total = 1
        mock_res.__iter__.return_value = [IndexedFile(name='file01')] 

        mock_search().query().extra().execute.return_value = mock_res

        sm = CommunityDataSearchManager(request)
        expected_result = {
            'trail': [{'name': '$SEARCH', 'path': '/$SEARCH'}],
            'name': '$SEARCH',
            'path': '/',
            'system': 'test.community',
            'type': 'dir',
            'children': [{'name': 'file01'}],
            'permissions': 'READ'
        }
        listing = sm.listing('test.community', '/')
        self.assertEqual(listing, expected_result)

class TestPublishedDataSearchMgr(TestCase):
    @patch('designsafe.apps.api.search.searchmanager.published_files.BaseSearchManager.__init__')
    def test_init(self, mock_base):
        request = MagicMock()
        request.query_string = 'test_query'
        request.username = 'test_user'

        sm = PublishedDataSearchManager(request)
        mock_base.assert_called_with(IndexedFile, IndexedFile.search())

    @patch('designsafe.apps.api.search.searchmanager.published_files.BaseSearchManager.__init__')
    @patch('designsafe.apps.api.search.searchmanager.published_files.Search')
    def test_search(self, mock_search, mock_base):
        request = MagicMock()
        request.query_string = 'test_query'
        request.username = 'test_user'

        mock_res = MagicMock()
        mock_res.hits.total = 1
        mock_res.__iter__.return_value = [IndexedFile(name='file01')] 

        mock_search().query().extra().execute.return_value = mock_res

        sm = PublishedDataSearchManager(request)
        expected_result = {
            'trail': [{'name': '$SEARCH', 'path': '/$SEARCH'}],
            'name': '$SEARCH',
            'path': '/',
            'system': 'test.published',
            'type': 'dir',
            'children': [{'name': 'file01'}],
            'permissions': 'READ'
        }
        listing = sm.listing('test.published', '/')
        self.assertEqual(listing, expected_result)

class TestPublicationSearchMgr(TestCase):
    @patch('designsafe.apps.api.search.searchmanager.publications.BaseSearchManager.__init__')
    def test_init(self, mock_base):
        request = MagicMock()
        request.query_string = 'test_query'
        request.username = 'test_user'

        sm = PublicationsSearchManager(request)
        mock_base.assert_called_with(IndexedPublication, Search())

    @patch('designsafe.apps.api.search.searchmanager.publications.BaseESPublicationLegacy')
    @patch('designsafe.apps.api.search.searchmanager.publications.BaseESPublication')
    @patch('designsafe.apps.api.search.searchmanager.publications.Search')
    def test_listing(self, mock_search, mock_pub, mock_leg_pub):

        request = MagicMock()
        request.query_string = 'test_query'
        request.username = 'test_user'

        fm = PublicationsSearchManager(request) 
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
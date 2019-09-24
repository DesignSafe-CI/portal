from unittest.mock import Mock, patch, MagicMock, PropertyMock
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.conf import settings
from designsafe.apps.api.search.views import SearchView
import json

class SearchViewTests(TestCase):

    @patch('designsafe.apps.api.search.views.SearchView.search_cms_content')
    @patch('designsafe.apps.api.search.views.SearchView.search_public_files')
    @patch('designsafe.apps.api.search.views.SearchView.search_published')
    @patch('designsafe.apps.api.search.views.SearchView.search_all')
    def test_search_view(self, mock_all, mock_pub, mock_files, mock_cms):
        self.assertTrue(True) 
        
        mock_request = MagicMock()
        mock_request.GET = {
            'query_string': 'test_query',
        }
        mock_all.return_value.execute.return_value.hits.total = 0 
        mock_all.return_value.count.return_value = 0
        mock_pub.return_value.count.return_value = 0
        mock_files.return_value.count.return_value = 0
        mock_cms.return_value.count.return_value = 0

        res = SearchView().get(mock_request)
        res_dict = json.loads(res.content)

        self.assertEqual(res_dict['all_total'], 0)
        self.assertEqual(res_dict['total_hits'], 0)
        self.assertEqual(res_dict['public_files_total'], 0)
        self.assertEqual(res_dict['published_total'], 0)
        self.assertEqual(res_dict['cms_total'], 0)




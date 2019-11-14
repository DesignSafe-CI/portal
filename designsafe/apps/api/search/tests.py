from mock import Mock, patch, MagicMock, PropertyMock
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.conf import settings
from designsafe.apps.api.search.views import SearchView
import json

class SearchViewTests(TestCase):

    def test_search_view(self):
        self.assertTrue(True) 
        
        mock_request = MagicMock()
        mock_request.GET = {
            'query_string': 'test_query',
        }

        res = SearchView().get(mock_request)
        res_dict = json.loads(res.content)

        self.assertEqual(res_dict['all_total'], 0)
        self.assertEqual(res_dict['total_hits'], 0)
        self.assertEqual(res_dict['public_files_total'], 0)
        self.assertEqual(res_dict['published_total'], 0)
        self.assertEqual(res_dict['cms_total'], 0)

        print json.loads(res.content)['all_total']




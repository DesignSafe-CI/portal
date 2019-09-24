import os
import json
import datetime
from mock import patch, MagicMock
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.conf import settings
from datetime import timedelta
from designsafe.apps.api.agave.filemanager.lookups import FileLookupManager
from django.contrib.auth.models import User

from designsafe.apps.api.agave import to_camel_case
from designsafe.apps.api.exceptions import ApiException

class MiscTests(TestCase):

    def test_to_camel_case(self):

        # test cases, first is expected output, second is input
        cases = (
            ('camelCase', 'camelCase'),
            ('_camelCase', '_camelCase'),
            ('snakeCase', 'snake_case'),
            ('_snakeCase', '_snake_case'),
            ('snakeCaseCase', 'snake_case_case'),
        )

        for case in cases:
            self.assertEqual(case[0], to_camel_case(case[1]))


class TestListingViews_auth(TestCase):
    fixtures = ['user-data.json', 'agave-oauth-token-data.json']
    @patch('designsafe.apps.api.agave.filemanager.lookups.FileLookupManager')
    def test_file_listing_view_private(self, mock_lookup):
        self.client.force_login(get_user_model().objects.get(username="ds_user"))
        mock_lookup()().listing.return_value = {'resp': 'data'}
        mock_lookup()().requires_auth = True
        resp = self.client.get('/api/agave/files/listing/agave/designsafe.storage.default/ds_user')
        mock_lookup.assert_called_with('agave')
        mock_lookup()().listing.assert_called_with(
            system='designsafe.storage.default', 
            file_path='ds_user',
             offset=0, 
             limit=100)
        self.client.logout()

        mock_lookup()().requires_auth = False
        resp = self.client.get('/api/public/files/listing/community/designsafe.storage.community//')
        mock_lookup.assert_called_with('community')
        mock_lookup()().listing.assert_called_with(
            system='designsafe.storage.community', 
            file_path='/',
             offset=0, 
             limit=100)

    


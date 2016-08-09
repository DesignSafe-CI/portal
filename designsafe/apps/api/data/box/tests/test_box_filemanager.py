from django.contrib.auth import get_user_model
from django.test import TestCase
from designsafe.apps.api.data.box.filemanager import FileManager as BoxFM
import requests_mock


class BoxFileManagerTests(TestCase):

    fixtures = ['user-data.json', 'box/box_user_token_data.json']

    @requests_mock.Mocker()
    def test_box_file_listing(self, m):

        with open('designsafe/apps/api/fixtures/box/box_folder.json') as f:
            api_resp = f.read()
            m.get('https://api.box.com/2.0/folders/11446498', text=api_resp)

        with open('designsafe/apps/api/fixtures/box/box_folder_items.json') as f:
            api_resp = f.read()
            m.get('https://api.box.com/2.0/folders/11446498/items', text=api_resp)

        user = get_user_model().objects.get(username='ds_user')
        bfm = BoxFM(user)
        box_file = bfm.listing('folder/11446498')
        self.assertEqual(box_file['type'], 'folder')
        self.assertEqual(box_file['id'], 'folder/11446498')
        self.assertEqual(box_file['name'], 'DesignSafe Test Data')
        self.assertEqual(len(box_file['children']), 2)

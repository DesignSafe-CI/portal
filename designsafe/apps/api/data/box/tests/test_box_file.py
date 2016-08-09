from django.test import TestCase
from designsafe.apps.api.data.box.file import BoxFile
from boxsdk.object.file import File
import json


class BoxFileTests(TestCase):

    fixtures = ['user-data.json', 'box/box_user_token_data.json']

    def test_box_file(self):

        with open('designsafe/apps/api/fixtures/box/box_file.json') as f:
            api_resp = f.read()
            original = File(session=None, object_id=u'5000948880',
                            response_object=json.loads(api_resp))
            box_file = BoxFile(original)

            self.assertEqual('file/5000948880', box_file.id)
            self.assertEqual('tigers.jpeg', box_file.name)
            self.assertTrue(box_file.previewable)
            self.assertEqual('Pictures', box_file.parent_path)

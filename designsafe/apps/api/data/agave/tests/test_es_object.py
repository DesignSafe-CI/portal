from django.test import TestCase
from django.contrib.auth import get_user_model
from django.conf import settings
from designsafe.apps.api.exceptions import ApiException
from designsafe.apps.api.data.agave.file import AgaveFile
from designsafe.apps.api.data.agave.agave_object import AgaveObject
from designsafe.apps.api.data.agave.elasticsearch.documents import Object
from designsafe.apps.auth.models import AgaveOAuthToken
from agavepy.agave import Agave
import dateutil.parser
import mock
import json
import os
import re

class MockListingRecursive(mock.MagicMock):
    def __init__(self, *args, **kwargs):
        super(mock.MagicMock, self).__init__(*args, **kwargs)
        lp = 'designsafe/apps/api/fixtures/object_listing_recursive.json'
        with open(lp) as f:
            listing_json = json.load(f)
        self.listing_json = listing_json

    def scan(self): 
        for o in self.listing_json:
            doc = Object(**o)
            #doc.to_dict.return_value = o
            yield doc       
        
class FileBaseTestCase(TestCase):
    fixtures = ['user-data.json', 'agave-oauth-token-data.json']

    def setUp(self):
        user = get_user_model().objects.get(pk=2)
        user.set_password('password')
        user.save()
        self.user = user

        with open('designsafe/apps/api/fixtures/agave_folder.json') as f:
            afolder_json = json.load(f)

        with open('designsafe/apps/api/fixtures/agave_file.json') as f:
            afile_json = json.load(f)

        with open('designsafe/apps/api/fixtures/agave_file_pems.json') as f:
            apems_json = json.load(f)

        self.afolder_json = afolder_json[0]
        self.afile_json = afile_json[0]
        self.apems_json = apems_json

    def get_mock_agave_file(self):
        ac = mock.Mock()
        wrap = self.afile_json.copy()
        wrap['lastModified'] = dateutil.parser.parse(wrap['lastModified'])
        af = AgaveFile(wrap = wrap, agave_client = ac)
        return af

    def get_mock_agave_folder(self):
        ac = mock.Mock()
        af = AgaveFile(wrap = self.afolder_json.copy(), agave_client = ac)
        return af

    def get_mock_object_file(self):
        doc = Object(
            mimeType = self.afile_json['mimeType'],
            name = self.afile_json['name'],
            format = self.afile_json['format'],
            deleted = False,
            lastModified = self.afile_json['lastModified'],
            fileType = os.path.splitext(self.afile_json['name'])[1] if self.afile_json['format'] != 'folder' else 'folder',
            agavePath = 'agave://{}/{}'.format(self.afile_json['system'], self.afile_json['path']),
            systemTags = [],
            length = self.afile_json['length'],
            systemId = self.afile_json['system'],
            path = os.path.split(self.afile_json['path'])[0],
            keywords = [],
            link = self.afile_json['_links']['self']['href'],
            type = self.afile_json['type'],
            permissions = self.apems_json
        )
        return doc

    def get_mock_object_folder(self):
        doc = Object(
            mimeType = self.afolder_json['mimeType'],
            name = self.afolder_json['name'] if self.afolder_json['name'] != '.' else os.path.split(self.afolder_json['path'])[1],
            format = self.afolder_json['format'],
            deleted = False,
            lastModified = self.afolder_json['lastModified'],
            fileType = os.path.splitext(self.afolder_json['name'])[1] if self.afolder_json['format'] != 'folder' else 'folder',
            agavePath = 'agave://{}/{}'.format(self.afolder_json['system'], self.afolder_json['path']),
            systemTags = [],
            length = self.afolder_json['length'],
            systemId = self.afolder_json['system'],
            path = os.path.split(self.afolder_json['path'])[0],
            keywords = [],
            link = self.afolder_json['_links']['self']['href'],
            type = self.afolder_json['type'],
            permissions = self.apems_json
        )
        return doc

class FileInitTestCase(FileBaseTestCase):
    @mock.patch.object(Object, 'save')
    @mock.patch.object(Object, 'update')
    @mock.patch('designsafe.apps.api.data.agave.elasticsearch.documents.Object.from_file_path')
    def test_object_from_agave_file(self, mock_obj_from_file_path, 
                            mock_obj_update, mock_obj_save):
        af = self.get_mock_agave_file()
        mock_obj_from_file_path.return_value = None
        
        doc = Object.from_agave_file(self.user.username, af)
        
        self.assertEqual(os.path.join(doc.path, doc.name),
                self.afile_json['path'])

class FileCopyTestCase(FileBaseTestCase):
    @mock.patch.object(Object, 'save')
    @mock.patch.object(Object, 'listing_recursive') 
    def test_copy_file(self, mock_listing_recursive, mock_save):
        doc = self.get_mock_object_file()
        target_name = 'file_copy.txt'
        doc_copy = doc.copy(self.user.username, target_name)

        self.assertEqual(mock_save.call_count, 2)
        self.assertEqual(doc_copy.name, target_name)
        mock_listing_recursive.assert_not_called()

    @mock.patch.object(Object, 'save')
    @mock.patch.object(Object, 'listing_recursive') 
    def test_copy_folder_is_creating_correct_objects(self, 
                        mock_listing_recursive, mock_save):
        lp = 'designsafe/apps/api/fixtures/object_listing_recursive.json'
        with open(lp) as f:
            listing_json = json.load(f)

        s = MockListingRecursive()
        mock_listing_recursive.return_value = (None, s)

        doc = self.get_mock_object_folder()
        doc.path = os.path.split(listing_json[0]['path'])[0]

        target_name = 'folder_copy'

        with mock.patch('designsafe.apps.api.data.agave.elasticsearch.documents.Object', spce = Object) as mock_obj_class:
            mock_obj_class.save.return_value = None
            doc_copy = doc.copy(self.user.username, target_name)
            #print 'Obj class was called: %d times' % mock_obj_class.call_count
            obj_class_calls = mock_obj_class.call_args_list

        for i, d in enumerate(listing_json):
            args, d_call = obj_class_calls[i]
            regex = r'^{}'.format(os.path.join(doc.path, target_name))
            self.assertEqual(d_call['path'], re.sub(regex, 
                                os.path.join(d['path'], target_name),
                                d['path']))

        mock_listing_recursive.assert_called_with(doc.systemId, 
                self.user.username, os.path.join(doc.path, doc.name))

    @mock.patch.object(Object, 'save')
    @mock.patch.object(Object, 'listing_recursive') 
    def test_copy_folder_is_saving_objects(self, 
                        mock_listing_recursive, mock_save):
        lp = 'designsafe/apps/api/fixtures/object_listing_recursive.json'
        with open(lp) as f:
            listing_json = json.load(f)

        s = MockListingRecursive()
        mock_listing_recursive.return_value = (None, s)

        doc = self.get_mock_object_folder()

        target_name = 'folder_copy'
        
        doc_copy = doc.copy(self.user.username, target_name)
        self.assertEqual(mock_save.call_count, len(listing_json) + 2)
        mock_listing_recursive.assert_called_with(doc.systemId, 
                self.user.username, os.path.join(doc.path, doc.name))
 
     
class FileDeleteTestCase(FileBaseTestCase):
    @mock.patch.object(Object, 'delete')
    @mock.patch.object(Object, 'listing_recursive')
    def test_delete_file(self, mock_listing_recursive, mock_delete):
        doc = self.get_mock_object_file()
        mock_listing_recursive.return_value = None

        doc.delete_recursive(self.user.username)

        self.assertTrue(mock_delete.called)
        mock_listing_recursive.assert_not_called()

    @mock.patch.object(Object, 'delete')
    @mock.patch.object(Object, 'listing_recursive')
    def test_delete_folder(self, mock_listing_recursive, mock_delete):
        lp = 'designsafe/apps/api/fixtures/object_listing_recursive.json'
        with open(lp) as f:
            listing_json = json.load(f)

        s = MockListingRecursive()
        mock_listing_recursive.return_value = (None, s)

        doc = self.get_mock_object_folder()

        cnt = doc.delete_recursive(self.user.username)

        mock_listing_recursive.assert_called_with(self.afolder_json['system'],
                    self.user.username, self.afolder_json['path'])
        self.assertEqual(mock_delete.call_count, len(listing_json) + 1)

class FileMoveTestCase(FileBaseTestCase):
    @mock.patch.object(Object, 'save')
    @mock.patch.object(Object, 'update')
    @mock.patch.object(Object, 'listing_recursive')
    def test_move_file(self, mock_listing_recursive, mock_update, mock_save):
        doc = self.get_mock_object_file()
        mock_listing_recursive.return_value = None
        target_path = 'path/to/new folder'

        doc.move(self.user.username, '%s/%s' % (target_path, doc.name))
        
        mock_update.assert_called_with(path = target_path,
                    agavePath = 'agave://{}/{}'.format(self.afile_json['system'],
                        os.path.join(target_path, self.afile_json['name'])))
        self.assertTrue(mock_save.called)
        mock_listing_recursive.assert_not_called()

    @mock.patch.object(Object, 'save')
    @mock.patch.object(Object, 'update')
    @mock.patch.object(Object, 'listing_recursive')
    def test_move_folder(self, mock_listing_recursive, mock_update, mock_save):
        lp = 'designsafe/apps/api/fixtures/object_listing_recursive.json'
        with open(lp) as f:
            listing_json = json.load(f)

        s = MockListingRecursive()
        mock_listing_recursive.return_value = (None, s)

        doc = self.get_mock_object_folder()
        target_path = 'path/to/new folder'
        doc.move(self.user.username, '%s/%s' % (target_path, doc.name))
        update_calls = mock_update.call_args_list

        for i, d in enumerate(listing_json):
            args, d_call = update_calls[i]
            regex = r'^{}'.format(self.afolder_json['path'])
            self.assertEqual(d_call['path'], 
                             re.sub(regex, 
                                os.path.join(target_path, self.afolder_json['name']),
                                d['path']))

        args, d_call = update_calls[-1]
        self.assertEqual(d_call['path'], target_path)
        self.assertEqual(mock_save.call_count, len(listing_json) + 1)
        mock_listing_recursive.assert_called_with(self.afolder_json['system'],
                self.user.username, self.afolder_json['path'])
                                                        
class FileRenameTestcase(FileBaseTestCase):
    @mock.patch.object(Object, 'save')
    @mock.patch.object(Object, 'update')
    @mock.patch.object(Object, 'listing_recursive')
    def test_rename_file(self, mock_listing_recursive, mock_update, mock_save):
        doc = self.get_mock_object_file()
        mock_listing_recursive.return_value = None
        target_name = 'rename_file.txt'

        doc.rename(self.user.username, target_name)
        
        origin_path = os.path.split(self.afile_json['path'])[0]

        mock_update.assert_called_with(name = target_name,
                    agavePath = 'agave://{}/{}'.format(self.afile_json['system'],
                        os.path.join(origin_path, target_name)))
        self.assertTrue(mock_save.called)
        mock_listing_recursive.assert_not_called()

    @mock.patch.object(Object, 'save')
    @mock.patch.object(Object, 'update')
    @mock.patch.object(Object, 'listing_recursive')
    def test_rename_folder(self, mock_listing_recursive, mock_update, mock_save):
        lp = 'designsafe/apps/api/fixtures/object_listing_recursive.json'
        with open(lp) as f:
            listing_json = json.load(f)

        s = MockListingRecursive()
        mock_listing_recursive.return_value = (None, s)

        doc = self.get_mock_object_folder()
        target_name = 'renamed folder'
        doc.rename(self.user.username, target_name)
        update_calls = mock_update.call_args_list

        origin_path = os.path.split(self.afolder_json['path'])[0]
        for i, d in enumerate(listing_json):
            args, d_call = update_calls[i]
            regex = r'^{}'.format(self.afolder_json['path'])
            self.assertEqual(d_call['path'], 
                             re.sub(regex, 
                                os.path.join(origin_path, target_name),
                                d['path']))

        args, d_call = update_calls[-1]
        self.assertEqual(d_call['name'], target_name)
        self.assertEqual(mock_save.call_count, len(listing_json) + 1)
        mock_listing_recursive.assert_called_with(self.afolder_json['system'],
                self.user.username, self.afolder_json['path'])


class FileShareTestCase(FileBaseTestCase):
    @mock.patch.object(Object, 'listing_recursive')
    @mock.patch.object(Object, 'save')
    @mock.patch.object(Object, 'update_pems')
    @mock.patch('designsafe.apps.api.data.agave.elasticsearch.documents.Object.from_file_path')
    def test_share_file(self, mock_obj_from_file_path, mock_update_pems, 
                                mock_save, mock_listing_recursive):
        doc = self.get_mock_object_file()
        mock_listing_recursive.return_value = None
        mock_obj = mock.Mock(spec = Object, autospec=True)
        mock_obj_from_file_path.return_value = mock_obj

        file_path = os.path.split(self.afile_json['path'])[0]
        file_path_comps = file_path.split('/')

        pems = 'READ_WRITE'
        user_to_share = 'share_user'
        doc.share(self.user.username, user_to_share, pems)

        from_file_path_calls = mock_obj_from_file_path.call_args_list
        for call in from_file_path_calls:
            args, kwargs = call
            self.assertEqual(args[0], self.afile_json['system'])
            self.assertEqual(args[1], self.user.username)
            self.assertEqual(args[2], '/'.join(file_path_comps))
            file_path_comps.pop()
           
        update_pems_calls = mock_update_pems.call_args_list
        for call in update_pems_calls:
            args, kwrgs = call
            self.assertEqual(args[0], user_to_share)
            self.assertEqual(args[1], pems)

        self.assertEqual(mock_update_pems.call_count, len(file_path_comps) + 1)
        self.assertEqual(mock_obj().save.call_count, len(file_path_comps))
        mock_listing_recursive.assert_not_called()
        self.assertTrue(mock_save.called)

    @mock.patch.object(Object, 'listing_recursive')
    @mock.patch.object(Object, 'save')
    @mock.patch.object(Object, 'update_pems')
    @mock.patch('designsafe.apps.api.data.agave.elasticsearch.documents.Object.from_file_path')
    def test_share_file(self, mock_obj_from_file_path, mock_update_pems, 
                                mock_save, mock_listing_recursive):
        lp = 'designsafe/apps/api/fixtures/object_listing_recursive.json'
        with open(lp) as f:
            listing_json = json.load(f)

        s = MockListingRecursive()
        mock_listing_recursive.return_value = (None, s)

        doc = self.get_mock_object_folder()

        mock_obj = mock.Mock(spec = Object, autospec=True)
        mock_obj_from_file_path.return_value = mock_obj

        file_path = os.path.split(self.afolder_json['path'])[0]
        file_path_comps = file_path.split('/')

        pems = 'READ_WRITE'
        user_to_share = 'share_user'
        doc.share(self.user.username, user_to_share, pems)

        from_file_path_calls = mock_obj_from_file_path.call_args_list
        for call in from_file_path_calls:
            args, kwargs = call
            self.assertEqual(args[0], self.afolder_json['system'])
            self.assertEqual(args[1], self.user.username)
            self.assertEqual(args[2], '/'.join(file_path_comps))
            file_path_comps.pop()

        update_pems_calls = mock_update_pems.call_args_list
        for call in update_pems_calls:
            args, kwrgs = call
            self.assertEqual(args[0], user_to_share)
            self.assertEqual(args[1], pems)

        self.assertEqual(mock_update_pems.call_count, len(listing_json) + 1)
        self.assertEqual(mock_obj().save.call_count, len(file_path_comps))
        mock_listing_recursive.assert_called_with(self.afolder_json['system'],
                        self.user.username, self.afolder_json['path'])
        self.assertTrue(mock_save.called)

class FileUpdatePemsTestCase(FileBaseTestCase):
    @mock.patch.object(Object, 'update')        
    @mock.patch.object(Object, 'save')
    def test_update_pems_update_read(self, mock_save, mock_update):
        doc = self.get_mock_object_file()
        user_to_share = 'user_to_share'

        origin_pems = [
            {
                'username': user_to_share,
                'recursive': True,
                'permission': {
                    'read': False,
                    'write': False,
                    'execute': False
                }
            }
        ]
        doc.permissions = origin_pems

        doc.update_pems(user_to_share, 'READ')

        _, kwargs = mock_update.call_args
        updated_pems = kwargs['permissions']

        self.assertEqual(len(updated_pems), len(origin_pems))
        self.assertTrue(updated_pems[0]['permission']['read'])
        self.assertFalse(updated_pems[0]['permission']['write'])
        self.assertFalse(updated_pems[0]['permission']['execute'])
        self.assertEqual(updated_pems[0]['username'], user_to_share)
        self.assertTrue(mock_save.called)

    @mock.patch.object(Object, 'update')        
    @mock.patch.object(Object, 'save')
    def test_update_pems_update_write(self, mock_save, mock_update):
        doc = self.get_mock_object_file()
        user_to_share = 'user_to_share'

        origin_pems = [
            {
                'username': user_to_share,
                'recursive': True,
                'permission': {
                    'read': False,
                    'write': False,
                    'execute': False
                }
            }
        ]
        doc.permissions = origin_pems

        doc.update_pems(user_to_share, 'WRITE')

        _, kwargs = mock_update.call_args
        updated_pems = kwargs['permissions']

        self.assertEqual(len(updated_pems), len(origin_pems))
        self.assertFalse(updated_pems[0]['permission']['read'])
        self.assertTrue(updated_pems[0]['permission']['write'])
        self.assertFalse(updated_pems[0]['permission']['execute'])
        self.assertEqual(updated_pems[0]['username'], user_to_share)
        self.assertTrue(mock_save.called)

    @mock.patch.object(Object, 'update')        
    @mock.patch.object(Object, 'save')
    def test_update_pems_add_read(self, mock_save, mock_update):
        doc = self.get_mock_object_file()
        new_user_to_share = 'new_user_to_share'

        origin_pems = [
            {
                'username': 'user_to_share',
                'recursive': True,
                'permission': {
                    'read': True,
                    'write': False,
                    'execute': False
                }
            }
        ]
        doc.permissions = origin_pems

        doc.update_pems(new_user_to_share, 'READ')

        _, kwargs = mock_update.call_args
        updated_pems = kwargs['permissions']

        for pems in updated_pems:
            if pems['username'] == 'user_to_share':
                self.assertTrue(pems['permission']['read'])
                self.assertFalse(pems['permission']['write'])
                self.assertFalse(pems['permission']['execute'])
            elif pems['username'] == new_user_to_share:
                self.assertTrue(pems['permission']['read'])
                self.assertFalse(pems['permission']['write'])
                self.assertFalse(pems['permission']['execute'])

        self.assertEqual(len(updated_pems), len(origin_pems) + 1)
        self.assertTrue(mock_save.called)

    @mock.patch.object(Object, 'update')        
    @mock.patch.object(Object, 'save')
    def test_update_pems_add_write(self, mock_save, mock_update):
        doc = self.get_mock_object_file()
        new_user_to_share = 'new_user_to_share'

        origin_pems = [
            {
                'username': 'user_to_share',
                'recursive': True,
                'permission': {
                    'read': True,
                    'write': False,
                    'execute': False
                }
            }
        ]
        doc.permissions = origin_pems

        doc.update_pems(new_user_to_share, 'WRITE')

        _, kwargs = mock_update.call_args
        updated_pems = kwargs['permissions']

        for pems in updated_pems:
            if pems['username'] == 'user_to_share':
                self.assertTrue(pems['permission']['read'])
                self.assertFalse(pems['permission']['write'])
                self.assertFalse(pems['permission']['execute'])
            elif pems['username'] == new_user_to_share:
                self.assertFalse(pems['permission']['read'])
                self.assertTrue(pems['permission']['write'])
                self.assertFalse(pems['permission']['execute'])

        self.assertEqual(len(updated_pems), len(origin_pems) + 1)
        self.assertTrue(mock_save.called)

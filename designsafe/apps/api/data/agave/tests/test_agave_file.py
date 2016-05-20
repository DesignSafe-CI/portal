from django.test import TestCase
from django.contrib.auth import get_user_model
from django.conf import settings
from designsafe.apps.api.exceptions import ApiException
from designsafe.apps.api.data.agave.file import AgaveFile
from designsafe.apps.api.data.agave.agave_object import AgaveObject
from designsafe.apps.api.data.agave.elasticsearch.documents import Object
from designsafe.apps.auth.models import AgaveOAuthToken
from agavepy.agave import Agave
import mock
import json
import os
import re

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

    def get_mock_file(self):
        ac = mock.Mock()
        af = AgaveFile(wrap = self.afile_json.copy(), agave_client = ac)
        return af

class FileInitTestCase(FileBaseTestCase):
    def test_file__init__(self):
        ac = mock.Mock(spec = Agave)
        af = AgaveFile(wrap = self.afile_json, 
                agave_client = ac)

        
        self.assertEqual(af.agave_client, ac)
        self.assertDictEqual(af._wrap, self.afile_json)
        self.assertFalse(af._permissions)

    def test_folder__init__(self):
        ac = mock.Mock(spec = Agave)
        af = AgaveFile(wrap = self.afile_json, 
                agave_client = ac)

        self.assertEqual(af.agave_client, ac)
        self.assertDictEqual(af._wrap, self.afile_json)
        self.assertEqual(af.name, af.path.split('/')[-1])
        self.assertFalse(af._permissions)


    def test_folder__init__with_pems(self):
        ac = mock.Mock(spec = Agave)
        self.afile_json['permissions'] = self.apems_json
        af = AgaveFile(wrap = self.afile_json, 
                agave_client = ac)

        self.assertEqual(af.agave_client, ac)
        self.assertDictEqual(af._wrap, self.afile_json)
        self.assertEqual(af.name, af.path.split('/')[-1])
        for i, pem in enumerate(af.permissions):
            self.assertDictEqual(pem, self.apems_json[i])

    def test_from_file_path(self):
        ac = mock.Mock(autospec = Agave)
        ac.files.list.return_value = [self.afile_json]
        
        file_path = '%s/%s' % (self.user.username, self.afile_json['path'])
        af = AgaveFile.from_file_path(settings.AGAVE_STORAGE_SYSTEM,
                self.user.username, file_path, agave_client = ac)

        ac.files.list.assert_called_with(systemId= settings.AGAVE_STORAGE_SYSTEM, filePath = file_path)
        self.assertEqual(af.full_path, self.afile_json['path'])

    def test_listing(self):
        with open('designsafe/apps/api/fixtures/agave_home_listing.json') as f:
            listing_json = json.load(f)
        ac = mock.Mock(autospec = Agave)
        ac.files.list.return_value = listing_json
        file_path = '%s/%s' % (self.user.username, self.afile_json['path'])

        listing = AgaveFile.listing(settings.AGAVE_STORAGE_SYSTEM,
                                    file_path, agave_client = ac)

        ac.files.list.assert_called_with(systemId = settings.AGAVE_STORAGE_SYSTEM, filePath = file_path)
        for i, af in enumerate(listing):
            self.assertEqual(af.full_path, listing_json[i]['path'])

    def test_mkdir(self):
        ac = mock.Mock(autospec = Agave)
        ac.files.manage.return_value = self.afile_json
        
        tail, head = os.path.split(self.afile_json['path'])
        file_path = self.afile_json['path']
        af = AgaveFile.mkdir(settings.AGAVE_STORAGE_SYSTEM,
                self.user.username, tail, head, agave_client = ac)

        body = '{{"action": "mkdir", "path": "{}"}}'.format(head)
        ac.files.manage.assert_called_with(systemId= settings.AGAVE_STORAGE_SYSTEM, filePath = tail, body = body)
        self.assertEqual(af.full_path, file_path)

class FileCreatePostitTestCase(FileBaseTestCase):
    @mock.patch.object(AgaveFile, 'call_operation')
    def test_create_postit(self, mock_call_op):
        af = self.get_mock_file()

        postit = af.create_postit(force = False, max_uses = 2, lifetime = 120)
        body = {
            'url': af._links['self']['href'],
            'maxUses': 2,
            'method': 'GET',
            'lifetime': 120,
            'noauth': False
        }
    
        mock_call_op.assert_called_with('postits.create', body = body)

class FileDownloadTestCase(FileBaseTestCase):
    @mock.patch.object(AgaveFile, 'call_operation')
    def test_download(self, mock_call_op):
        af = self.get_mock_file()

        download = af.download()
        
        mock_call_op.assert_called_with('files.download', systemId = af.system,
                    filePath = af.full_path)

class FilePropertiesTestCase(FileBaseTestCase):
    def test_ext(self):
        af = self.get_mock_file()
        ext = os.path.splitext(self.afile_json['name'])[1]
        self.assertEqual(af.ext, ext)

    def test_full_path(self):
        af = self.get_mock_file()
        self.assertEqual(af.full_path, self.afile_json['path'])

    def test_id(self):
        af = self.get_mock_file()
        self.assertEqual(af.id, os.path.join(self.afile_json['system'],
                                self.afile_json['path']))

    def test_parent_path(self):
        af = self.get_mock_file()
        path, name = os.path.split(self.afile_json['path'])
        self.assertEqual(af.parent_path, path)

    @mock.patch.object(AgaveFile, 'call_operation')
    def test_permissions(self, mock_call_op):
        af = self.get_mock_file()
        pems = af.permissions
        mock_call_op.assert_called_with('files.listPermissions', 
            filePath = self.afile_json['path'], systemId = self.afile_json['system'])

    def test_previewable_txt(self):
        af = self.get_mock_file()
        for ext in af.SUPPORTED_PREVIEW_EXTENSIONS:
            af.name = re.sub(r'%s$' % af.ext, ext, af.name)
            self.assertTrue(af.previewable)

    def test_trail(self):
        af = self.get_mock_file()
        trail = af.trail
        path_comps = af.parent_path.split('/')
        for o in trail:
            path = '/'.join(path_comps)
            path_name = os.path.join(o['path'], o['name'])
            self.assertEqual(path_name, path)
            path_comps.pop()

class FileCopyTestCase(FileBaseTestCase):
    @mock.patch.object(AgaveFile, 'call_operation')
    def test_copy(self, mock_call_op):
        af = self.get_mock_file()
        copy_name = 'file_copy.txt'
        copy_wrap = self.afile_json.copy()
        copy_wrap['path'] = re.sub(r'%s$' % copy_wrap['name'], copy_name, copy_wrap['path'])
        copy_wrap['name'] = copy_name

        mock_call_op.return_value = copy_wrap

        with mock.patch('designsafe.apps.api.data.agave.file.AgaveFile', 
                                            spec = True) as mock_af_class:
            ret = af.copy(copy_name)
            af_call = mock_af_class.call_args
            af_args, af_kwargs = af_call
            wrap = af_kwargs['wrap']
            self.assertTrue(wrap['path'], copy_wrap['path'])

        mock_call_op.assert_called_with('files.manage', 
            systemId = self.afolder_json['system'], filePath = self.afile_json['path'],
            body = {'action': 'copy', 'path': copy_name})

class FileDeleteTestCase(FileBaseTestCase):
    @mock.patch.object(AgaveFile, 'call_operation')
    def test_delete(self, mock_call_op):
        af = self.get_mock_file()
        af.delete()
        mock_call_op.assert_called_with('files.delete', systemId = af.system,
                            filePath = af.full_path)

class FileMoveTestCase(FileBaseTestCase):
    @mock.patch.object(AgaveFile, 'call_operation')
    def test_move(self, mock_call_op):
        af = self.get_mock_file()
        origin_path = af.full_path
        move_path = 'path/to/moved folder/%s' % af.name
        af.move(move_path)

        mock_call_op.assert_called_with('files.manage', systemId = af.system,
                filePath = origin_path, 
                body = {'action': 'move', 'path': move_path})
        self.assertEqual(af.path, move_path)

class FileRenameTestCase(FileBaseTestCase):
    @mock.patch.object(AgaveFile, 'call_operation')
    def test_rename(self, mock_call_op):
        af = self.get_mock_file()
        origin_name = af.name
        ren_name = 'renamed file.txt'
        origin_parent_path = re.sub(r'%s$' % self.afile_json['name'], 
                                        '', self.afile_json['path'])
        ren_path = os.path.join(origin_parent_path, ren_name)
        af.rename(ren_name)

        mock_call_op.assert_called_with('files.manage', 
                systemId = self.afile_json['system'],
                filePath = self.afile_json['path'],
                body = {'action': 'rename', 'path': ren_name})
        self.assertEqual(af.full_path, ren_path)
        self.assertEqual(af.name, ren_name)

class FileShareTestCase(FileBaseTestCase):
    @mock.patch.object(AgaveFile, 'call_operation')
    def test_share(self, mock_call_op):
        af = self.get_mock_file()
        user_to_share = 'user_to_share'
        permission = 'READ_WRITE'
        body = '{{ "recursive": "true", "permission": "{}", "username": "{}" }}'.format(permission, user_to_share)

        af.share(user_to_share, permission)

        mock_call_op.assert_called_with('files.updatePermissions',
            filePath = self.afile_json['path'],
            systemId = self.afile_json['system'],
            body = body,
            raise_agave = True)

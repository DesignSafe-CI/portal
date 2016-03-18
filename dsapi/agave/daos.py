import datetime
from agavepy.agave import AgaveException
from requests.exceptions import HTTPError
from designsafe.libs.elasticsearch.api import Object, PublicObject, Experiment, Project
import utils as agave_utils
import requests
import copy
import urllib
#Data Access Objects to represent data to and from APIs
import re
import json
import logging
import hashlib
import os
import time

logger = logging.getLogger(__name__)

object_name = 'object'
project_name = 'project'
model_name = 'model'
shared_with_me = 'Shared with me'
datetime_format = '%Y-%m-%dT%H:%M:%S'

class AgaveObject(object):
    """
    Main class for agave objects
    """

    def __init__(self, agave_client = None, **kwargs):
        self.agave_client = agave_client

    def get_operation(self, a, op):
        o = reduce(getattr, op.split("."), a)
        return o

    def exec_operation(self, op, **kwargs):
        response = op(**kwargs)
        return response

    def call_operation(self, operation, **kwargs):
        a = self.agave_client
        op = self.get_operation(a, operation)
        try:
            response = self.exec_operation(op, **kwargs)
        except AgaveException as e:
            logger.error('Agave Error:{}\nArgs:{} '.format(e.message, kwargs),
                exc_info = True,
                extra = kwargs)
            if e.response.status_code == 404:
                raise
            else:
                raise HTTPError(e.message)
            response = None
        except KeyError as e:
            if e.message == 'date-time':
                response = None
            else:
                raise
        return response

    def stage_tasks(self, main_task, link_tasks):
        """
        TODO: implement celery linking tasks if needed.
        http://docs.celeryproject.org/en/latest/userguide/calling.html#linking-callbacks-errbacks
        """
        pass

    def partial_args_to_args(self):
        """
        Implement to convert Celery partial arguments to corresponding classes
        """
        pass

    def split_filepath(self, path):
        path = path.strip('/')
        path, name =  os.path.split(path)
        if path == '':
            path = '/'
        return path, name

class FileManager(AgaveObject):
    def share(self, system_id, me, path, username, permission):
        paths = path.split('/')
        ret = {}
        mf = AgaveFolderFile.from_path(self.agave_client,
                                    system_id, path)
        #If it's a folder upate permissions for every metadata of every file in the folder.
        if mf.format == 'folder':
            self.call_operation('files.updatePermissions',
                                filePath = path,
                                systemId = system_id,
                                body = '{{ "recursive": "true", "permission": "{}", "username": "{}" }}'.format(permission, username))
            
            objs, search = Object().search_partial_path(system_id, 
                                            me, mf.full_path)
            cnt = 0
            if objs.hits.total:
                while cnt <= objs.hits.total - len(objs):
                    for o in search[cnt:cnt+len(objs)]:
                        pems = self.call_operation('files.listPermissions', 
                                    filePath = o.path + '/' + o.name, systemId = system_id)
                        o.update(permissions = pems)
                    cnt = cnt + len(objs)

        #Update permissions for every metadata object to reach the desired file.
        l = len(paths)
        for i in range(l):
            if len(paths) >= 2:
                res, s = Object().search_exact_path(system_id, me, '/'.join(paths[:-1]), paths[-1])
            else:
                res, s = Object().search_exact_path(system_id, me, '/', paths[-1])
            if res.hits.total:
                o = res[0]
                self.call_operation('files.updatePermissions', 
                                filePath = '/'.join(paths),
                                systemId = system_id,
                                body = '{{ "permission": "{}", "username": "{}" }}'.format(permission, username))
                pems = self.call_operation('files.listPermissions', 
                                filePath = o.path + '/' + o.name, systemId = system_id)
                o.update(permissions = pems)
                if i == 0:
                    ret = o
            paths.pop()
        return ret

    def check_shared_folder(self, system_id, username):
        res, s = Object().search_exact_path(system_id, username, username, shared_with_me)
        if len(res) == 0:
            mf = Object()
            mf.path = username
            mf.name = shared_with_me
            mf.type = 'folder'
            mf.fileType = 'folder'
            mf.mimeType = 'text/directory'
            mf.systemId = system_id
            mf.system_tags = [{"shared": "true"}]
            mf.permissions = [{'username': username, 'permission': {'read': True}}]
            mf.length = 32768
            id_str = username + '-magic-' + shared_with_me
            mf._id = hashlib.md5(id_str).hexdigest()
            mf.save()
            logger.debug('Shared folder created: {}'.format(mf._id))
        else:
            o = res[0]
            if getattr(o, 'length', None) is None or o.length == 0:
                o.update(length = 32768)

    def list_path(self, system_id, path, username, special_dir, is_public = False):
        if special_dir == shared_with_me and path == '/':
            res, s = Object().search_special_dir(system_id = system_id,
                              username = username, path = path, self_root = False)
            ret = s.scan()
        else:
            if is_public:
                res, s = PublicObject().search_exact_folder_path(system_id, path)
                ret = s.scan()
            else:
                res, s = Object().search_exact_folder_path(system_id, username, path)
                ret = s.scan()
                if not res.hits.total:
                    logger.warning('Failing back to Agave FS')
                    listing = self.call_operation('files.list', systemId = system_id,
                                        filePath = path)
                    files = [AgaveFolderFile(agave_client = self.agave_client,
                                            file_obj = o) for o in listing if o['name'] != '.']
                    ret = files 
        return ret

    def upload_files(self, uploaded_files, system_id = None, path = None):
        #TODO: make this more efficient.
        mfs = []
        fs = []
        for uf_name, uf in uploaded_files.iteritems():
            f = AgaveFolderFile.from_file(agave_client = self.agave_client,
                            f = uf, system_id = system_id,
                            path = path)
            f.upload(uf, headers = {'Authorization': 'Bearer %s' % self.agave_client._token})
            #  agave temporarily returns lower size for large files, set proper size from upload handler
            f.length = uf.size

            fs.append(f)
            mf = Object(**f.to_dict())
            mf.save()
            mf.update(deleted = False)
            mfs.append(mf)
        return mfs, fs

    def rename(self, path, new, system_id, username):
        path, name = self.split_filepath(path)

        f = AgaveFolderFile.from_path(agave_client = self.agave_client,
                        system_id = system_id,
                        path = path + '/' + name)

        mf = Object().get_exact_path(f.system, username, f.path, f.name)

        logger.info('Renaming file from path: {}'.format(f.full_path))

        new_path, new_name = self.split_filepath(new)
        f.rename(new_name)

        logger.info('Renamed to : {}'.format(f.full_path))
        
        if mf is None:
            raise HTTPError('File/Folder not found.')

        if mf.format == 'folder':
            objs, search = Object().search_partial_path(system_id, 
                                            username, mf.path + '/' + mf.name)
            cnt = 0
            if objs.hits.total:
                while cnt <= objs.hits.total - len(objs):
                    for o in search[cnt:cnt+len(objs)]:
                        regex = r'^{}'.format(mf.path + '/' + mf.name)
                        o.update(path = re.sub(regex, 
                                           path + '/' + new_name, 
                                           o.path, count = 1))
                        o.update(agavePath = 'agave://{}/{}'.format(o.systemId, o.path + '/' + o.name))
                    cnt += len(objs)
        mf.update(name = new_name)
        mf.update(agavePath = 'agave://{}/{}'.format(mf.systemId, mf.path + '/' + mf.name))
        logger.info('Meta Renamed to: {}'.format(mf.path + '/' + mf.name))
        return mf, f

    def move(self, path, new, system_id, username):
        path, name = self.split_filepath(path)
        new_path, new_name = self.split_filepath(new)
        logger.debug('new_path: {}, new_name: {}'.format(new_path, new_name))

        f = AgaveFolderFile.from_path(agave_client = self.agave_client,
                        system_id = system_id,
                        path = path + '/' + name)

        mf = Object().get_exact_path(f.system, username, f.path, f.name)
        if mf is None:
            raise HTTPError('File/Folder not found.')

        logger.info('Moving file from path: {}'.format(f.path))
        f.move(new)
        logger.info('Moved to: {}'.format(f.path))

        logger.info('Moving metadata from path: {}'.format(mf.path + '/' + mf.name))
        if mf.format == 'folder':
            objs, search = Object().search_partial_path(system_id, 
                                            username, mf.path + '/' + mf.name)
            cnt = 0
            if objs.hits.total:
                while cnt <= objs.hits.total - len(objs):
                    for o in search[cnt:cnt+len(objs)]:
                        regex = r'^{}'.format(mf.path + '/' + mf.name)
                        o.update(path = re.sub(regex, new_path + '/' + mf.name, o.path, count = 1))
                        o.update(agavePath = 'agave://{}/{}'.format(o.systemId, o.path + '/' + o.name))
                    cnt += len(objs)
        mf.update(path = new_path)
        mf.update(agavePath = 'agave://{}/{}'.format(mf.systemId, mf.path + '/' + mf.name))

        logger.info('Moved metadata to: {}'.format(mf.path + '/' + mf.name))
        return mf, f

    def copy(self, path, new, system_id, username):
        path, name = self.split_filepath(path)
        new_path, new_name = self.split_filepath(new)

        f = AgaveFolderFile.from_path(agave_client = self.agave_client,
                        system_id = system_id,
                        path = path + '/' + name)

        f.copy(new)
        if f.format == 'folder':
            for file_obj in agave_utils.fs_walk(self.agave_client, system_id = system_id, folder = new):
                aff = AgaveFolderFile(agave_client = self.agave_client, file_obj = file_obj)
                o = Object(**aff.to_dict())
                logger.info('Creating: {}'.format(o.path + '/' + o.name))
                o.save()
                #Get the metadata for the base folder to return.
                if aff.full_path == new:
                    mf = o
        else:
            mf = AgaveFolderFile.from_path(agave_client = self.agave_client,
                            system_id = system_id,
                            path = new)
            mf = Object(**nf.to_dict())
            mf.save()
        return mf, f

    def mkdir(self, path, new, system_id, username):
        #path, name = self.split_filepath(path)
        new_path, new_name = self.split_filepath(urllib.unquote(new))
        logger.info('path: {} , new: {}'.format(path, new))
        args = {
            'systemId': system_id,
            'filePath': path,
            'body':'{{"action": "mkdir","path": "{}"}}'.format(new_name)
        }

        self.call_operation('files.manage', **args)
        f = AgaveFolderFile.from_path(agave_client = self.agave_client,
                    system_id = system_id,
                    path = path + '/' + new_name)
        mf = Object(**f.to_dict())
        mf.save()
        return mf, f

    def delete(self, system_id, path, username):
        path, name = self.split_filepath(path)
        res, search = Object().search_exact_path(system_id, username, path, name)
        if res.hits.total:
            o = res[0]
            o.update(deleted = True)
            return o
        else:
            if res.hits.total == 0:
                logger.error('Folder/File to delete not found')
                res = [Object()]
            else:
                logger.error('Multiple folder/files found')
                for r in res:
                    r.update(deleted = True)
            return res[0]

    def get(self, system_id, path , username, is_public):
        path, name = self.split_filepath(path)
        if is_public:
            res, search = PublicObject().search_exact_path(
                           system_id = system_id,
                           username = username, 
                           path = path,
                           name = name)
            if res.hits.total:
                meta = res[0]
                experiments = []
                project = {}
                res, search = Experiment().search_by_project(
                           project = meta.project)
                if res.hits.total:
                    for e in search.scan():
                        experiments.append(e.to_dict())
                res, search = Project().search_by_name(
                           name = meta.project)
                if res.hits.total:
                    project = res[0].to_dict()
                ret = {
                    'meta':meta.to_dict(),
                    'project': project,
                    'experiments': experiments
                }
                meta_obj = meta
            else:
                meta_obj = None
                ret = {}
        else:
            res, search = Object().search_exact_path(
                           system_id = system_id,
                           username = username, 
                           path = path,
                           name = name)
            if res.hits.total:
                ret = res[0].to_dict()
                meta_obj = res[0]
            else:
                meta_obj = None
                ret = {}
        return meta_obj, ret

    def search_public_meta(self, q, filesystem, username):
        logger.debug('Q string: {}'.format(q))
        q = json.loads(q)
        qs = ''
        if 'all' in q:
            qs = q['all']
        d = {
            'system_id': filesystem,
            'username': username,
            'qs': qs
        }
        d['fields'] = ['name']
        p_res, p_s = Project().search_query(**d)
        p_names = ['{}.groups'.format(o.name[0]) for o in p_s.scan()]
        d['fields'] = ['project']
        e_res, e_s = Experiment().search_query(**d) 
        e_names = ['{}.groups'.format(o.project) for o in e_s.scan()]
        po_names = p_names + e_names
        d.pop('fields')
        res, s = PublicObject().search_project_folders(system_id = filesystem, username = username, project_names = po_names)
        return res, s


    def search_meta(self, q, filesystem, username, is_public = False):
        #Update this with aggregation for efficiency and easier paginagion.
        logger.debug('Q string: {}'.format(q))
        q = json.loads(q)
        qs = ''
        if 'all' in q:
            qs = q['all']
        if is_public:
            res, s = PublicObject().search_query(system_id = filesystem,
                         username = username, qs = qs)
                        
        else:
            res, s = Object().search_query(system_id = filesystem,
                          username = username, qs = qs)
        #return s.scan()
        return res, s

class AgaveFilesManager(AgaveObject):
    '''
    @deprecated
    Use FileManager
    '''
    def share(self, system_id, path, username, permission):
        paths = path.split('/')
        ret = {}
        mf = AgaveMetaFolderFile.from_path(self.agave_client,
                                    system_id, path)
        #If it's a folder upate permissions for every metadata of every file in the folder.
        if mf.file_type == 'folder':
            q = '''{{
                    "name": "{}",
                    "value.path": {{ "$regex": "^{}(/.*)*$", "$options": "m"}},
                    "value.systemId": "{}"
                }}'''.format(object_name, mf.path + '/' + mf.name, system_id)
            objs = self.call_operation('meta.listMetadata', q = q)
            for obj in objs:
                self.call_operation('meta.updateMetadataPermissions',
                                uuid = obj.uuid,
                                body = '{{ "permission": "{}", "username": "{}" }}'.format(permission, username))

            self.call_operation('files.updatePermissions',
                                filePath = '/'.join(paths),
                                systemId = system_id,
                                body = '{{ "recursive": "true", "permission": "{}", "username": "{}" }}'.format(permission, username))
        #Update file permission on the actual file/folder
        self.call_operation('files.updatePermissions', 
                            filePath = '/'.join(paths),
                            systemId = system_id,
                            body = '{{ "permission": "{}", "username": "{}" }}'.format(permission, username))
        #Update permissions for every metadata object to reach the desired file.
        for i in range(len(paths)):
            mf = AgaveMetaFolderFile.from_path(self.agave_client,
                                        system_id, '/'.join(paths))
            resp = self.call_operation('meta.updateMetadataPermissions',
                                uuid = mf.uuid,
                                body = '{{ "permission": "{}", "username": "{}" }}'.format(permission, username))
            if i == 0:
                ret = resp

            paths.pop()
        return ret

    def check_shared_folder(self, system_id, username):
        q = '''{{
                "name": "{}",
                "value.path": "{}",
                "value.name": "{}",
                "value.systemId": "{}"
            }}'''.format(object_name, username, shared_with_me, system_id)
        res = self.call_operation('meta.listMetadata', q = q)
        if len(res) == 0:
            mf = AgaveMetaFolderFile(agave_client = self.agave_client, meta_obj = { 'value': {} })
            mf.path = username
            mf.name = shared_with_me
            mf.type = 'folder'
            mf.file_type = 'folder'
            mf.mime_type = 'text/directory'
            mf.system_id = system_id
            mf.meta_name = object_name
            mf.system_tags = {"shared": "true"}
            mf.save()

    def list_path(self, system_id = None, path = None):
        res = self.call_operation('files.list', 
                **{'systemId': system_id, 'filePath': path})
        ret = [AgaveFolderFile(self.agave_client, file_obj = o) for o in res]
        return ret

    def list_meta_path(self, system_id = None, path = None, special_dir = None, username = None):
        paths = path.split('/')
        if special_dir == shared_with_me and path == '/':
            q = '''{{ "value.deleted": "false",
                      "name": "{}",
                      "value.path": "/",
                      "value.name": {{ "$not": {{ "$regex": "^{}$", "$options": "m"}} }},
                      "value.systemId": "{}" }}'''.format(object_name, username, system_id)
        else:
            q = '''{{ "value.deleted": "false",
                      "name": "{}",
                      "value.path": "{}",
                      "value.systemId": "{}" }}'''.format(object_name, path, system_id)

        logger.info('searching: {}'.format(q))
        res = self.call_operation('meta.listMetadata',
                **{'q': q})
        ret = [AgaveMetaFolderFile(agave_client = self.agave_client, 
                    meta_obj = o) for o in res]
        return ret

    def search_meta(self, q, system_id):
        if q is None:
            return []
        q = json.loads(q)
        meta_q = '{}';
        if 'all' in q:
            meta_q = '''{{
                "$or": [
                    {{"value.name": {{"$regex": "{term}", "$options": "i"}} }},
                    {{"value.path": {{"$regex": "{term}", "$options": "i"}} }},
                    {{"value.keywords": {{"$regex": "{term}", "$options": "i"}} }}
                ],
                "value.systemId": "{system_id}"
            }}'''.format(term = q['all'], system_id = system_id)
        logger.info('json to search: {}'.format(meta_q))
        res = self.call_operation('meta.listMetadata', **{'q': meta_q})
        ret = [AgaveMetaFolderFile(agave_client = self.agave_client,
                    meta_obj = o) for o in res]
        return ret

    def upload_files(self, uploaded_files, system_id = None, path = None):
        mfs = []
        fs = []
        for uf_name, uf in uploaded_files.iteritems():
            f = AgaveFolderFile.from_file(agave_client = self.agave_client,
                            f = uf, system_id = system_id,
                            path = path)
            logger.debug('file: {}'.format(f.as_json()))
            f.upload(uf, headers = {'Authorization': 'Bearer %s' % self.agave_client._token})
            #  agave temporarily returns lower size for large files, set proper size from upload handler
            f.length = uf.size

            fs.append(f)
            mf = AgaveMetaFolderFile(agave_client = self.agave_client,
                                    meta_obj = f.as_meta_json())
            logger.info('metadata: {}'.format(mf.as_json()))
            mf.save()
            mfs.append(mf)
        return mfs, fs

    def rename(self, path = None, new = None, system_id = None):
        name = ''
        paths = path.split('/')
        if len(paths) >= 2:
            path = '/'.join(paths[:-1])
            name = paths[-1]
        f = AgaveFolderFile.from_path(agave_client = self.agave_client,
                        system_id = system_id,
                        path = path + '/' + name)
        logger.info('Renaming file from path: {}'.format(f.path))
        f.rename(new.split('/')[-1])
        logger.info('Renamed to : {}'.format(f.path))

        mf = AgaveMetaFolderFile.from_path(agave_client = self.agave_client,
                        system_id = system_id,
                        path = path + '/' + name)
        logger.info('Renaming metadata from path: {}'.format(mf.path + '/' + mf.name))
        mf.rename(new.split('/')[-1])
        logger.info('Renamed to: {}'.format(mf.path + '/' + mf.name))
        return mf, f

    def move(self, path = None, new = None, system_id = None):
        name = ''
        paths = path.split('/')
        if len(paths) >= 2:
            path = '/'.join(paths[:-1])
            name = paths[-1]

        f = AgaveFolderFile.from_path(agave_client = self.agave_client,
                        system_id = system_id,
                        path = path + '/' + name)

        mf = AgaveMetaFolderFile.from_path(agave_client = self.agave_client,
                        system_id = system_id,
                        path = path + '/' + name)

        logger.info('Moving file from path: {}'.format(f.path))
        f.move(new)
        logger.info('Moved to: {}'.format(f.path))

        logger.info('Moving metadata from path: {}'.format(mf.path + '/' + mf.name))
        mf.move(new)
        logger.info('Moved metadata to: {}'.format(mf.path + '/' + mf.name))
        return mf, f

    def copy(self, path = None, new = None, system_id = None):
        name = ''
        paths = path.split('/')
        if len(paths) >= 2:
            path = '/'.join(paths[:-1])
            name = paths[-1]
        f = AgaveFolderFile.from_path(agave_client = self.agave_client,
                        system_id = system_id,
                        path = path + '/' + name)

        mf = AgaveMetaFolderFile.from_path(agave_client = self.agave_client,
                        system_id = system_id,
                        path = path + '/' + name)
        f.copy(new)
        mf.copy(new)
        return mf, f

    def mkdir(self, path = None, new = None, system_id = None):
        new = new.split('/')
        new = new[-1]
        logger.info('path {} new {}'.format(path, new))
        args = {
            'systemId': system_id,
            'filePath': path,
            'body':'{{"action": "mkdir","path": "{}"}}'.format(new)
        }

        self.call_operation('files.manage', **args)
        f = AgaveFolderFile.from_path(agave_client = self.agave_client,
                    system_id = system_id,
                    path = path + '/' + new)
        logger.debug('dir: {}'.format(f.as_json()))
        logger.debug('dir: {}'.format(f.as_meta_json()))
        mf = AgaveMetaFolderFile(agave_client = self.agave_client, 
                                meta_obj = f.as_meta_json())
        mf.save()
        return mf, f
        
class AgaveFolderFile(AgaveObject):
    def __init__(self, agave_client = None, file_obj = None, **kwargs):
        super(AgaveFolderFile, self).__init__(agave_client = agave_client, **kwargs)
        #self.uuid = None
        self.meta_link = None
        self.format = file_obj.get('format', 'raw')
        self.last_modified = file_obj['lastModified']
        self.length = file_obj['length']
        self.mime_type = file_obj['mimeType']
        self.name = file_obj['name']
        self.path = file_obj['path'].strip('/')
        self.system = file_obj['system']
        self.type = file_obj['type']
        self.meta_link = None

        if '_links' in file_obj:
            self.link = file_obj['_links']['self']['href']
        else:
            self.link = None
            self.meta_link = None

        if self.name == '.':
            self.name = self.path.split('/')[-1]
            self.path = '/'.join(self.path.split('/')[:-1])
        else:
            paths = self.path.split('/')
            self.name = paths[-1]
            self.path = '/'.join(paths[:-1])

        if self.path == '':
            self.path = '/'
        self.agave_path = 'agave://{}/{}'.format(self.system, self.full_path)
        if self.link is not None:
            self.permissions = self._get_permissions()
        else:
            self.permissions = []

    @classmethod
    def from_path(cls, agave_client = None, system_id = None, path = None):
        ao = AgaveObject(agave_client = agave_client)
        res = ao.call_operation('files.list', systemId = system_id, filePath = path)
        if len(res) > 0:
            f = res[0]
        else:
            #TODO: raise custom exception
            return None
        return cls(agave_client = agave_client, file_obj = f)

    @classmethod
    def from_file(cls, agave_client = None, f = None, system_id = None, path = None):
        d = {
            'format': 'raw',
            'lastModified': datetime.datetime.now().strftime(datetime_format),
            'length': f.size,
            'mimeType': f.content_type,
            'name': f.name,
            'path': path + '/' + f.name,
            'system': system_id,
            'type': 'file'
        }
        return cls(agave_client = agave_client, file_obj = d)

    @property
    def full_path(self):
        full_path = self.path + '/' + self.name
        full_path = full_path.strip('/')
        return full_path

    @property
    def uuid(self):
        try:
            res = self.call_operation('files.list', filePath = self.full_path, systemId = self.system)
        except HTTPError as e:
            if e.response.status_code == 404:
                return self
            else:
                raise
        if res:
            obj = res[0]

        if 'metadata' in obj['_links']:
            self.meta_link = obj['_links']['metadata']['href']
            self.uuid = json.loads(self.meta_link.split('?q=')[1])['associationIds']
        return self

    def _get_permissions(self):
        '''
        Return permissions of self.
        '''
        #TODO: This should be a @property and it should be as lazy as possible.
        ret = self.call_operation('files.listPermissions', filePath = self.full_path, systemId = self.system)
        return ret

    #TODO: Might want to implement corresponding Encoder/Decoder classes
    def as_json(self):
        return {
            'format': self.format,
            'lastModified': self.last_modified,
            'length': self.length,
            'mimeType': self.mime_type,
            'name': self.name,
            'path': self.path,
            'permissions': self.permissions,
            'systemId': self.system,
            'type': self.type,
            'link': self.link,
            'metaLink': self.meta_link,
            'agavePath': self.agave_path,
            'permissions': self.permissions
        }

    def as_meta_json(self):
        f_dict = {
            'deleted': 'false',
            'type': 'file' if self.type == 'file' else 'folder',
            'fileType': self.name.split('.')[-1] if self.format != 'folder' else 'folder',
            'length': self.length,
            'mimeType': self.mime_type,
            'name': self.name,
            'path': self.parent_path ,
            'systemId': self.system,
            'keywords': [],
            'systemTags': {},
        }
        o = {
            'name': object_name,
            'value': f_dict,
            'permissions': self.permissions
        }
        return o

    def to_dict(self):
        d = {
            'lastModified': self.last_modified,
            'length': self.length,
            'format': self.format,
            'mimeType': self.mime_type,
            'name': self.name,
            'path': self.path,
            'permissions': self.permissions,
            'systemId': self.system,
            'type': self.type,
            'deleted': False,
            'fileType': self.name.split('.')[-1] if self.format != 'folder' else 'folder',
            'link': self.link,
            'agavePath': self.agave_path,
            'keywords': [],
            'systemTags': []
        }
        return d

    def _update(self, obj):
        if self.uuid is None:
            self._set_uuid()
        for key, val in self.__dict__.iteritems():
            nv = getattr(obj, key)
            if val != nv:
                setattr(self, key, nv)
        return self

    @property
    def encoded_link(self):
        filepath = self.link.replace(self.agave_client.api_server, "")
        #url = self.agave_client.api_server + urllib.pathname2url(filepath)
        url = self.agave_client.api_server + urllib.quote(filepath, '/')
        return url

    def download_stream(self, headers):
        '''
        @deprecated
        Use download_postit()
        '''
        stream = requests.get(self.link, stream=True, headers = headers)
        return stream

    def download_postit(self):
        postit_data = {
            'url': self.encoded_link + '?force=true',
            'maxUses': 1,
            'method': 'GET',
            'lifetime': 60,
            'noauth': False
        }
        logger.debug('postit data: {}'.format(postit_data))
        postit = self.call_operation('postits.create', body = postit_data)
        logger.debug('Postit: {}'.format(postit))
        return postit['_links']['self']['href']

    def upload(self, f = None, headers = None):
    #TODO: Updating a file should be put into a queue.
        data = {
            'fileToUpload': f,
            'filePath': self.path,
            'fileName': self.name
        }
        url = '{}/files/v2/media/system/{}/{}'.format(
            self.agave_client.api_server, self.system, self.path)
        resp = requests.post(url, files = data, headers = headers)
        resp.raise_for_status()
        time.sleep(.500)
        r = AgaveFolderFile.from_path(agave_client = self.agave_client,
                                system_id = self.system,
                                path = self.path + '/' + self.name)
        #logger.info('r_json: {}'.format(r.as_json()))
        self._update(r)
        return self

    def rename(self, name):
        #name = urllib.quote_plus(name)
        name = urllib.unquote(name)
        d = {
            'systemId': self.system,
            'filePath': self.full_path,
            'body': {"action": "rename", "path": name}
        }
        logger.debug('Calling files.manage with this: {}'.format(d))
        self.name = name
        res = self.call_operation('files.manage', **d)
        return self

    def move(self, path):
        path = urllib.unquote(path)
        base_path, file_name = os.path.split(path)
        d = {
            'systemId': self.system,
            'filePath': self.full_path,
            'body': {"action": "move", "path": path}
        }
        logger.debug('Calling files.manage d: {}'.format(d))
        res = self.call_operation('files.manage', **d)
        self.path = path
        return self

    def copy(self, name):
        name = urllib.unquote(name)
        d = {
            'systemId': self.system,
            'filePath': self.full_path,
            'body': {"action": "copy", "path": name}
        }
        res = self.call_operation('files.manage', **d)
        return res

class AgaveMetaFolderFile(AgaveObject):
    def __init__(self, agave_client = None, meta_obj = None, **kwargs):
        super(AgaveMetaFolderFile, self).__init__(agave_client = agave_client, **kwargs)
        self.uuid = meta_obj.get('uuid', None)
        self.association_ids = meta_obj.get('associationIds', [])
        self.deleted = meta_obj['value'].get('deleted', 'false')
        self.type = meta_obj['value'].get('type', 'file')
        self.file_type = meta_obj['value'].get('fileType', None)
        self.length = meta_obj['value'].get('length', 0)
        self.mime_type = meta_obj['value'].get('mimeType', None)
        self.name = meta_obj['value'].get('name', None)
        self.path = meta_obj['value'].get('path', None)
        self.system_id = meta_obj['value'].get('systemId', None)
        self.keywords = meta_obj['value'].get('keywords', None)
        self.system_tags = meta_obj['value'].get('systemTags', None)

        self.last_modified = meta_obj.get('lastUpdated', None)
        self.created = meta_obj.get('created', None)
        self.meta_name = meta_obj.get('name', None)
        self.owner = meta_obj.get('owner', None)
        self.internal_username = meta_obj.get('internalUsername', None)
        self.schema_id = meta_obj.get('schemaId', None)
        self.agave_path = 'agave://{}/{}'.format(meta_obj['value'].get('systemId', None), meta_obj['value'].get('path', '') + '/' + meta_obj['value'].get('name', ''))
        self.permissions = []
        self._links = ''
        if self.uuid is not None:
            self.permissions = self._get_permissions()

        if self.path is not None and self.path != '/':
            self.path = self.path.strip('/')
        
        if '_links' in meta_obj:
            self.link = meta_obj['_links']['self']['href']
            self._links = meta_obj['_links']
        
    @classmethod
    def from_path(cls, agave_client = None, system_id = None, path = None):
        paths = path.split('/')
        name = ''

        if len(paths) >= 2:
            path = '/'.join(paths[:-1])
            name = paths[-1]
        else:
            path = '/'
            name = paths[0]

        ao = AgaveObject(agave_client = agave_client)
        q = '''{{"name": "{}", "value.path": "{}", 
            "value.name": "{}", 
            "value.systemId": "{}"}}'''.format(object_name, path, name, system_id)
        res = ao.call_operation('meta.listMetadata', **{'q': q})
        if len(res) > 1:
            logger.warning('Multiple Metadata objects found for q = {}'.format(q)) 
            meta_obj = res[0]
        elif len(res) == 1:
            meta_obj = res[0]
        elif len(res) == 0:
            logger.error('No Metadata object found for q = {}'.format(q))
            #Should we automatically create the object in Agave? Probably not in prod.
            if path == '/':
                searchpath = name
            else:
                searchpath = path + '/' + name
            f = AgaveFolderFile.from_path(agave_client = agave_client,
                                         system_id = system_id,
                                         path = searchpath)
            f_dict = f.as_meta_json()
            logger.info('Creating metadata {}'.format(f_dict))
            meta_obj = ao.call_operation('meta.addMetadata', **{'body': f_dict})
            logger.info('Metadata created {}'.format(meta_obj))
        return cls(agave_client = agave_client, meta_obj = meta_obj)

    @classmethod
    def from_file(cls, agave_client = None, f = None, system_id = None, path = None):
        ao = AgaveObject(agave_client = agave_client)
        q = '''{{"name": "{}", 
                 "value.path": "{}",
                 "value.name": "{}",
                 "value.systemId": "{}"
               }}'''.format(object_name, path, f.name, system_id)
        res = ao.call_operation('meta.listMetadata', **{'q': q})
        logger.info('metadata list: {}'.format(res))
        if len(res) > 0:
            return cls(agave_client = agave_client, meta_obj = res[0])
        else:
            d = {
                'associationIds': [],
                'value': {
                    'deleted': 'false',
                    'fileType': f.name.split('.')[-1] if len(f.name.split('.')) > 1 else 'folder',
                    'length': f.size,
                    'mimeType': f.content_type,
                    'name': f.name,
                    'path': path,
                    'systemId': system_id,
                    'keywords': [],
                    'systemTags': {},
                },
                'lastUpdated': datetime.datetime.now().strftime(datetime_format),
                'created': datetime.datetime.now().strftime(datetime_format),
                'name': object_name
            }
        return cls(agave_client = agave_client, meta_obj = d)

    def _get_permissions(self):
        '''
        Used to get permissions from Agave and add the obj to self.
        '''
        ret = self.call_operation('meta.listMetadataPermissions', uuid = self.uuid)
        return ret

    def _get_upated_fields(self, new_meta):
        fields = set()
        for f, v in self.__dict__.iteritems():
            if not callable(v) and not f.startswith('__'):
                new_meta_attr = getattr(new_meta, f)
                if new_meta_attr is not None and new_meta_attr != getattr(self, f):
                    fields.add(f)
        return fields

    def _update(self, new_meta):
        fields = self._get_upated_fields(new_meta)
        for f in fields:
            nf = getattr(new_meta, f)
            setattr(self, f, nf)
        return self

    def update_from_json(self, new_meta):
        for key, val in new_meta.iteritems():
            if key in self.__dict__:
                if key == 'keywords':
                    val = set(val)
                logger.info('Setting key {}  val {}'.format(key, val))
                setattr(self, key, list(val))
        self.save()
        return self

    def save(self):
        #TODO: push old object into history list
        '''
        q = '{"name": "history", "associationIds":["{}"]'.format(self.uuid)
        history = self.call_operation('meta.listMetadata', {'q': q})
        history.value['history'] += self.as_json()
        self.call_operation('meta.addUpdate', 'body': history)
        '''
        if self.uuid is None:
            q = '''{{
                    "name": "{}",
                    "value.path": "{}",
                    "value.name": "{}",
                    "value.systemId": "{}"
                }}'''.format(object_name, self.path, self.name, self.system_id)
            search = self.call_operation('meta.listMetadata', q = q)
            res = None
            if len(search) == 1:
                meta = search[0]
                res = self.call_operation('meta.updateMetadata', 
                                               uuid = meta.uuid, 
                                               body = self.as_meta_json())
                meta = res
            elif len(search) > 1:
                logger.warning('Multiple metadata objects for q: {}'.format(q))
                meta = search[0]
                res = self.call_operation('meta.updateMetadata', 
                                               uuid = meta.uuid, 
                                               body = self.as_meta_json())
                meta = res
            elif len(search) == 0:
                res = self.call_operation('meta.addMetadata', **{'body': self.as_meta_json()})
                meta = res
            if res is None:
                meta = AgaveMetaFolderFile.from_path(agave_client = self.agave_client,
                                    system_id = self.system_id,
                                    path = self.path + '/' + self.name)
            else:
                meta = AgaveMetaFolderFile(agave_client = self.agave_client, meta_obj = res)
            self._update(meta)
        else:
            self.call_operation('meta.updateMetadata',
                            uuid = self.uuid,
                            body = self.as_meta_json())
        return self

    #TODO: Updating a file should be put into a queue.
    def upload_file(self, f = None, headers = None):
        data = {
            'fileToUpload': f,
            'filePath': self.path,
            'fileName': self.name
        }
        url = '{}/files/v2/media/system/{}/{}'.format(
            self.agave_client.api_server, self.system_id, self.path)
        resp = requests.post(url, files = data, headers = headers)
        resp.raise_for_status()
        r_json = resp.json()['result']
        file_obj = AgaveFolderFile.from_path(agave_client = self.agave_client,
                        system_id = r_json['systemId'],
                        path = r_json['path']
                        )
        file_dict = file_obj.as_meta_json()
        new_meta = AgaveMetaFolderFile(self.agave_client, 
                        meta_obj = {'name': object_name, 
                                    'value': file_dict})
        self.save()
        return self

    def rename(self, name):
        if self.type == 'folder':
            q = '''{{
                    "name": "{}",
                    "value.path": {{ "$regex": "^{}", "$options": "m"}},
                    "value.systemId": "{}"
                }}'''.format(object_name,
                             self.path + '/' + self.name,
                             self.system_id)
            objs = self.call_operation('meta.listMetadata', q = q)
            for obj in objs:
                o = AgaveMetaFolderFile(agave_client = self.agave_client,
                                        meta_obj = obj)
                regex = r'{}'.format(self.path + '/' + self.name)
                o.path = re.sub(regex, self.path + '/' + name, o.path, count = 1)
                o.save()
        self.name = name
        self.save()
        return self

    def move(self, path):
        name = ''
        paths = path.split('/')
        if len(paths) >= 2:
            path = '/'.join(paths[:-1])
            name = paths[-1]
        if self.type == 'folder':
            q = '''{{
                    "name": "{}",
                    "value.path": {{ "$regex": "^{}", "$options": "m"}},
                    "value.systemId": "{}"
                }}'''.format(object_name,
                             self.path + '/' + self.name,
                             self.system_id)
            objs = self.call_operation('meta.listMetadata', q = q)
            for obj in objs:
                o = AgaveMetaFolderFile(agave_client = self.agave_client,
                                        meta_obj = obj)
                regex = r'{}'.format(self.path + '/' + self.name)
                o.path = re.sub(regex, path + '/' + name, o.path, count = 1)
                o.save()
        self.path = path
        self.name = name
        self.save()
        return self

    def copy(self, path):
        name = ''
        paths = path.split('/')
        if len(paths) >= 2:
            path = '/'.join(paths[:-1])
            name = paths[-1]

        if self.type == 'folder':
            q = '''{{
                    "name": "{}",
                    "value.path": {{ "$regex": "^{}", "$options": "m"}},
                    "value.systemId": "{}"
                }}'''.format(object_name,
                             self.path + '/' + self.name,
                             self.system_id)
            objs = self.call_operation('meta.listMetadata', q = q)
            for obj in objs:
                o = AgaveMetaFolderFile(agave_client = self.agave_client,
                                        meta_obj = obj)
                no = copy.copy(o)
                no.system_tags = o.system_tags
                no.keywords = o.keywords
                no.uuid = None
                regex = r'{}'.format(self.path + '/' + self.name)
                no.path = re.sub(regex, path + '/' + name, no.path, count = 1)
                logger.info('Saving {}'.format(o.as_json()))
                no.save()
        nmeta = copy.copy(self)
        nmeta.system_tags = self.system_tags
        nmeta.keywords = self.keywords
        nmeta.uuid = None
        nmeta.name = name
        nmeta.path = path
        nmeta.save()
        return self

    def delete(self):
        if self.type == 'folder':
            q = '''{{
                    "name": "{}",
                    "value.path": {{ "$regex": "^{}", "$options": "m"}},
                    "value.systemId": "{}"
                }}'''.format(object_name,
                             self.path + '/' + self.name,
                             self.system_id)
            objs = self.call_operation('meta.listMetadata', q = q)
            for obj in objs:
                o = AgaveMetaFolderFile(agave_client = self.agave_client,
                                        meta_obj = obj)
                o.deleted = 'true'
                o.save()
        self.deleted = 'true'
        self.save()
        return self

    #TODO: Might want to implement corresponding Encoder/Decoder classes
    def as_json(self):
        return {
            'uuid': self.uuid,
            'associationIds': self.association_ids,
            'deleted': self.deleted,
            'type': self.type,
            'fileType': self.file_type,
            'length': self.length,
            'mimeType': self.mime_type,
            'name': self.name,
            'path': self.path,
            'systemId': self.system_id,
            'keywords': self.keywords,
            'systemTags': self.system_tags,
            'lastModified': self.last_modified,
            'created': self.created,
            'meta_name': self.meta_name,
            'owner': self.owner,
            'schemaId': self.schema_id,
            'agavePath': self.agave_path,
            'permissions': self.permissions           
        }

    def as_meta_json(self):
        return{
            'uuid': self.uuid,
            'name': self.meta_name,
            'associationIds': self.association_ids,
            'value': {
                'mimeType': self.mime_type,
                'name': self.name,
                'deleted': self.deleted,
                'fileType': self.file_type,
                'type': self.type,
                'length': self.length,
                'path': self.path,
                'systemId': self.system_id,
                'keywords': self.keywords,
                'systemTags': self.system_tags,
            }
        }

    def to_dict(self):
        d = {
            '_id': self.uuid,
            'uuid': self.uuid,
            'association_ids': self.association_ids,
            'lastUpdated': self.last_modified,
            'created': self.created,
            'name': self.meta_name,
            'owner': self.owner,
            'internalUsername': self.internal_username,
            'schemaId': self.schema_id,
            'value': {
                'deleted': self.deleted,
                'type': self.type,
                'fileType': self.file_type,
                'length': self.length,
                'mimeType': self.mime_type,
                'name': self.name,
                'path': self.path,
                'systemId': self.system_id,
                'keywords': self.keywords,
                'systemTags': self.system_tags,
            },
            'links': self._links,
            'permissions': self.permissions
        }
        return d 

import datetime
from agavepy.agave import AgaveException
from requests.exceptions import HTTPError
import requests
import copy
#Data Access Objects to represent data to and from APIs
import re
import logging

logger = logging.getLogger(__name__)

object_name = 'object'
project_name = 'project'
model_name = 'model'
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

class AgaveFilesManager(AgaveObject):
    
    def list_path(self, system_id = None, path = None):
        res = self.call_operation('files.list', 
                **{'systemId': system_id, 'filePath': path})
        ret = [AgaveFolderFile(self.agave_client, file_obj = o) for o in res]
        return ret

    def list_meta_path(self, system_id = None, path = None):
        if path[-1] == '/':
            path = path[:-1]
        q = '''{{ "value.deleted": "false", "name": "{}", "value.path": "{}", "value.systemId": "{}" }}'''.format(object_name, path, system_id)
        logger.info('searching: {}'.format(q))
        res = self.call_operation('meta.listMetadata',
                **{'q': q})
        ret = [AgaveMetaFolderFile(agave_client = self.agave_client, 
                    meta_obj = o) for o in res]
        return ret

    def search_meta(self, q):
        res = self.call_operation('meta.listMetadata', **{'q': q})
        ret = [AgaveMetaFolderFile(agave_client = self.agave_client,
                    meta_obj = o) for o in res]
        return ret

    def upload_file(self, uploaded, system_id = None, path = None):
        f = AgaveFolderFile.from_file(agave_client = self.agave_client,
                        f = uploaded, system_id = system_id,
                        path = path)
        logger.info('file: {}'.format(f.as_json()))
        f.upload(uploaded, headers = {'Authorization': 'Bearer %s' % self.agave_client._token})
        mf = AgaveMetaFolderFile(agave_client = self.agave_client, 
                                meta_obj = f.as_meta_json())
        logger.info('metadata: {}'.format(mf.as_json()))
        mf.save()
        return mf, f

    def rename(self, path = None, new = None, system_id = None):
        name = ''
        paths = path.split('/')
        if len(paths) >= 2:
            path = '/'.join(paths[:-1])
            name = paths[-1]
        f = AgaveFolderFile.from_path(agave_client = self.agave_client,
                        system_id = system_id,
                        path = path + '/' + name)
        f.rename(new.split('/')[-1])

        mf = AgaveMetaFolderFile.from_path(agave_client = self.agave_client,
                        system_id = system_id,
                        path = path + '/' + name)
        mf.rename(new.split('/')[-1])
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
        f.move(new)

        mf = AgaveMetaFolderFile.from_path(agave_client = self.agave_client,
                        system_id = system_id,
                        path = path + '/' + name)
        mf.move(new)
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
        f.copy(new)

        mf = AgaveMetaFolderFile.from_path(agave_client = self.agave_client,
                        system_id = system_id,
                        path = path + '/' + name)
        mf.copy(new)
        return mf, f

class AgaveFolderFile(AgaveObject):

    def __init__(self, agave_client = None, file_obj = None, **kwargs):

        super(AgaveFolderFile, self).__init__(agave_client = agave_client, **kwargs)
        self.uuid = file_obj.get('uuid', None)
        self.format = file_obj.get('format', 'raw')
        self.last_modified = file_obj['lastModified']
        self.length = file_obj['length']
        self.mime_type = file_obj['mimeType']
        self.name = file_obj['name']
        self.path = file_obj['path']
        self.permissions = file_obj['permissions']
        self.system = file_obj['system']
        self.type = file_obj['type']
        if '_links' in file_obj:
            self.link = file_obj['_links']['self']['href']
            self.meta_link = file_obj['_links']['metadata']['href'] if 'metadata' in file_obj['_links'] else None
        else:
            self.link = None
            self.meta_link = None

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
            'path': path,
            'permissions': 'READ_WRITE',
            'system': system_id,
            'type': 'file'
        }
        return cls(agave_client = agave_client, file_obj = d)

    @property
    def parent_path(self):
        path = self.path.split('/')
        path = path[:-1]
        return '/'.join(path)

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
            'metaLink': self.meta_link
        }

    def as_meta_json(self):
        f_dict = {
            'deleted': 'false',
            'type': 'file' if self.type == 'file' else 'folder',
            'fileType': self.name.split('.')[-1] if self.type != 'folder' else 'folder',
            'length': self.length,
            'mimeType': self.mime_type,
            'name': self.name,
            'path': self.parent_path,
            'systemId': self.system,
            'keywords': [],
            'systemTags': {}
        }
        o = {
            'name': object_name,
            'value': f_dict,
        }
        return o

    def _update(self, obj):
        for key, val in self.__dict__.iteritems():
            nv = getattr(obj, key)
            logger.info('key {}: old {}, new {}'.format(key, val, nv))
            if val != nv:
                setattr(self, key, nv)
                logger.info('setted {} val {}'.format(key, getattr(self, key)))
        return self

    def download_stream(self, headers):
        stream = requests.get(self.link, stream=True, headers = headers)
        return stream

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
        r_json = AgaveFolderFile.from_path(agave_client = self.agave_client,
                                system_id = self.system,
                                path = self.path + '/' + self.name)
        logger.info('r_json: {}'.format(r_json.as_json()))
        self._update(r_json)
        return self

    def rename(self, name):
        self.name = name
        d = {
            'systemId': self.system,
            'filePath': self.path,
            'body': {"action": "rename", "path": name}
        }
        res = self.call_operation('files.manage', **d)
        return self

    def move(self, path):
        d = {
            'systemId': self.system,
            'filePath': self.path,
            'body': {"action": "move", "path": path}
        }
        res = self.call_operation('files.manage', **d)
        self.path = path
        return self

    def copy(self, name):
        f = copy.copy(self)
        f.name = name
        f.uuid = None
        d = {
            'systemId': f.system,
            'filePath': f.path,
            'body': {"action": "copy", "path": name}
        }
        res = self.call_operation('files.manage', **d)
        return f

class AgaveMetaFolderFile(AgaveObject):
    def __init__(self, agave_client = None, meta_obj = None, **kwargs):
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
        self.schema_id = meta_obj.get('schemaId', None)
        self.uuid = meta_obj.get('uuid', None)
        super(AgaveMetaFolderFile, self).__init__(agave_client = agave_client, **kwargs)
        
    @classmethod
    def from_path(cls, agave_client = None, system_id = None, path = None):
        paths = path.split('/')
        name = ''

        if len(paths) >= 2:
            path = '/'.join(paths[:-1])
            name = paths[-1]

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
            f = AgaveFolderFile.from_path(agave_client = agave_client,
                                         system_id = system_id,
                                         path = path)
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
            if len(search) == 1:
                meta = res[0]
                res = self.call_operation('meta.updateMetadata', 
                                               uuid = meta.uuid, 
                                               body = self.as_meta_json())
                meta = res
            elif len(search) > 1:
                logger.warning('Multiple metadata objects for q: {}'.format(q))
                meta = res[0]
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
        self.name = name
        self.save()
        return self

    def move(self, path):
        name = ''
        paths = path.split('/')
        if len(paths) >= 2:
            path = '/'.join(paths[:-1])
            name = paths[-1]
        self.path = path
        self.name = name
        self.save()
        return self

    def copy(self, name):
        nmeta = copy.copy(self)
        nmeta.uuid = None
        nmeta.name = name.split('/')[-1]
        nmeta.save()
        return self

    def delete(self):
        self.deleted = 'true'
        self.save()
        return self

    #TODO: Might want to implement corresponding Encoder/Decoder classes
    def as_json(self):
        return {
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
           'uuid': self.uuid,
        }

    def as_meta_json(self):
        return{
            'associationIds': self.association_ids,
            'name': self.meta_name,
            'schemaId': self.schema_id,
            'uuid': self.uuid,
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
                'systemTags': self.system_tags
            }
        }

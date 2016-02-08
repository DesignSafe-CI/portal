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
        logger.info('listing path {} from {}'.format(path, system_id))
        res = self.call_operation('files.list', 
                **{'systemId': system_id, 'filePath': path})
        ret = [AgaveFolderFile(self.agave_client, file_obj = o) for o in res]
        return ret

    def list_meta_path(self, system_id = None, path = None):
        if path[-1] == '/':
            path = path[:-1]
        q = '''{{ "name": "{}", "value.path": "{}", "value.systemId": "{}" }}'''.format(object_name, path, system_id)
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

class AgaveFolderFile(AgaveObject):

    def __init__(self, agave_client = None, file_obj = None, **kwargs):

        super(AgaveFolderFile, self).__init__(agave_client = agave_client, **kwargs)
        self.format = file_obj['format']
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
    def from_path(cls, agave_client = None, system_id = None, path = None, username = None):
        if path is None or path == '/':
            path = username
        try:
            ao = AgaveObject(agave_client = agave_client)
            res = ao.call_operation('files.list', systemId = system_id, filePath = path)
            if len(res) > 0:
                f = res[0]
            else:
                #TODO: raise custom exception
                return None
        except AgaveException as e:
            raise HTTPError(e.message)
            return None
        return cls(agave_client = agave_client, file_obj = f)

    @classmethod
    def from_file(cls, agave_client = None, f = None, system_id = None, path = None, username = None):
        ao = AgaveObject(agave_client = agave_client)
        res = ao.call_operation('files.list', systemId = system_id, filePath = path + f.name)
        if len(res) > 0:
            return cls(agave_client = agave_client, file_obj = res[0])
        else:
            d = {
                'format': 'raw',
                'lastModified': datetime.datetime.now(),
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
            'lastModified': self.last_modified.strftime(datetime_format),
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
        logger.info('AgaveFolderFile: {}'.format(f_dict))
        o = {
            'name': object_name,
            'value': f_dict,
        }
        return o

    def download_stream(self, headers):
        stream = requests.get(self.link, stream=True, headers = headers)
        return stream

    def get_metadata(self):
        ret = None
        mngr = AgaveFilesManager(agave_client = self.agave_client)
        q = '{{"name": "{}", "value.path":"{}", "value.systemId":"{}", "value.name":"{}"}}'.format(object_name, self.parent_path, self.system, self.name)
        l = mngr.search_meta(q = q )
        if len(l) > 0:
            ret = l[0]
        return ret

    def save_as_metadata(self):
        mo = self.get_metadata()
        if mo is not None:
            return mo
        meta = self.as_meta_json()
        resp = self.call_operation('meta.addMetadata', **{'body': meta})
        return resp

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
    def from_path(cls, agave_client = None, system_id = None, path = None, username = None):
        if path is None or path == '/':
            path = username

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
                                         path = path,
                                         username = username)
            f_dict = f.as_meta_json()
            logger.info('Creating metadata {}'.format(f_dict))
            meta_obj = ao.call_operation('meta.addMetadata', **{'body': f_dict})
            logger.info('Metadata created {}'.format(meta_obj))
        return cls(agave_client = agave_client, meta_obj = meta_obj)

    @classmethod
    def from_file(cls, agave_client = None, f = None, system_id = None, path = None, username = None):
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
                'name': object_name,
                'owner': username
            }
        return cls(agave_client = agave_client, meta_obj = d)

    def _get_upated_fields(self, new_meta):
        fields = set()
        for f, v in self.__dict__.iteritems():
            if not callable(v) and not f.startswith('__'):
                if getattr(new_meta, f) != getattr(self, f):
                    fields.add(f)
        return fields

    def update(self, new_meta):
        #TODO: push old object into history list
        '''
        q = '{"name": "history", "associationIds":["{}"]'.format(self.uuid)
        history = self.call_operation('meta.listMetadata', {'q': q})
        history.value['history'] += self.as_json()
        self.call_operation('meta.addUpdate', 'body': history)
        '''

        #q = '''{{
        #        "name": "{}",
        #        "value.path": "{}",
        #        "value.name": "{}",
        #        "value.systemId": "{}"
        #    }}'''.format(object_name, new_meta.path,
        #                new_meta.name, new_meta.system_id)

        fields = self._get_upated_fields(new_meta)
        for f in fields:
            nf = getattr(new_meta, f)
            setattr(self, f, nf)

        #self.association_ids = new_meta.association_ids

        #self.deleted = new_meta.deleted
        #self.file_type = new_meta.file_type
        #self.length = new_meta.length
        #self.mime_type = new_meta.mime_type
        #self.name = new_meta.name
        #self.path = new_meta.path
        #self.system_id = new_meta.system_id
        #self.keywords = new_meta.keywords
        #self.system_tags = new_meta.system_tagas

        #self.meta_name = new_meta.meta_name
        #self.schema_id = new_meta.schema_id

        self.call_operation('meta.addMetadata', **{'body': self.as_meta_json()})
        return self

    def save(self):
        us_upper = re.compile(r'(.)([A-Z][a-z]+)')
        us_lower = re.compile('([a-z0-9])([A-Z])')
        res = self.call_operation('meta.addMetadata', **{'body': self.as_meta_json()})
        if res is None:
            new_meta = AgaveMetaFolderFile.from_path(agave_client = self.agave_client,
                                system_id = self.system_id,
                                path = self.path + '/' + self.name)
        else:
            new_meta = AgaveMetaFolderFile(agave_client = self.agave_client, meta_obj = res)
        for k, v in new_meta.__dict__.iteritems():
            setattr(self, k, v)
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

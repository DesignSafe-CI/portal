import datetime
from agavepy.agave import AgaveException
from requests.exceptions import HTTPError
import requests
import copy
#Data Access Objects to represent data to and from APIs
import logging

logger = logging.getLogger(__name__)

object_name = 'object'
project_name = 'project'
model_name = 'model'
datetime_format = '%Y-%m-%d %H:%M:%S'

class AgaveObject(object):
    """
    Main class for agave objects
    """

    def __init__(self, agave_client = None, **kwargs):
        self.agave_client = agave_client

    def get_operation(self, a, op):
        o = reduce(getattr, op.split("."), a)
        return o

    def exec_operation(self, op, args):
        response = op(**args)
        return response

    def call_operation(self, operation, args):
        a = self.agave_client
        op = self.get_operation(a, operation)
        try:
            response = self.exec_operation(op, args)
        except AgaveException as e:
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
                {'systemId': system_id, 'filePath': path})
        ret = [AgaveFolderFile(self.agave_client, file_obj = o) for o in res]
        return ret

    def list_meta_path(self, system_id = None, path = None):
        if path[-1] == '/':
            path = path[:-1]
        q = '''{{ "name": "{}", "value.path": "{}", "value.systemId": "{}" }}'''.format(object_name, path, system_id)
        logger.info('searching: {}'.format(q))
        res = self.call_operation('meta.listMetadata',
                {'q': q})
        ret = [AgaveMetaFolderFile(agave_client = self.agave_client, 
                    meta_obj = o) for o in res]
        return ret

    def search_meta(self, q):
        res = self.call_operation('meta.listMetadata', {'q': q})
        ret = [AgaveMetaFolderFile(agave_client = self.agave_client,
                    meta_obj = o) for o in res]
        return ret

class AgaveFolderFile(AgaveObject):

    def __init__(self, agave_client = None, file_obj = None, **kwargs):

        super(AgaveFolderFile, self).__init__(agave_client = agave_client, **kwargs)

        if file_obj is not None:
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
    def frompath(cls, agave_client = None, system_id = None, path = None, username = None):
        if username is None:
            #TODO: raise custom exception
            return None

        if path is None or path == '/':
            path = username
        try:
            res = agave_client.files.list(systemId = system_id, filePath = path)
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
        res = agave_client.files.list(systemId = system_id, filePath = path + f.name)
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
            'type': "file" if self.format == 'folder' else 'folder',
            'fileType': self.name.split('.')[-1] if self.format != 'folder' else 'folder',
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
        resp = self.call_operation('meta.addMetadata', {'body': meta})
        return resp

class AgaveMetaFolderFile(AgaveObject):
    def __init__(self, agave_client = None, meta_obj = None, **kwargs):
        self.association_ids = meta_obj['associationIds']
        self.deleted = meta_obj['value'].get('deleted', 'false')
        self.file_type = meta_obj['value'].get('fileType', None)
        self.length = meta_obj['value'].get('length', 0)
        self.mime_type = meta_obj['value'].get('mimeType', None)
        self.name = meta_obj['value'].get('name', None)
        self.path = meta_obj['value'].get('path', None)
        self.system_id = meta_obj['value'].get('systemId', None)
        self.keywords = meta_obj['value'].get('keywords', None)
        self.system_tags = meta_obj['value'].get('systemTags', None)

        self.last_modified = meta_obj['lastUpdated']
        self.created = meta_obj['created']
        self.meta_name = meta_obj['name']
        self.owner = meta_obj['owner']
        self.schema_id = meta_obj['schemaId']
        self.uuid = meta_obj['uuid']
        super(AgaveMetaFolderFile, self).__init__(agave_client = agave_client, **kwargs)
        
    @classmethod
    def frompath(cls, agave_client = None, system_id = None, path = None, username = None):
        if username is None:
            #TODO: raise exception
            return None

        if path is None or path == '/':
            path = username
        try:
            q = '''{{"name" = "{}", "value.path" = "{}", 
                "value.systemId" = "{}"}}'''.format(object_name, path, system_id)
            res = self.call_operation('meta.listMetadata', {'q': q})
            if len(res) > 1:
                logger.warning('Multiple Metadata objects found for q = {}'.format(q)) 
                meta_obj = res[0]
            elif len(res) == 1:
                meta_obj = res[0]
            elif len(res) == 0:
                logger.error('No Metadata object found for q = {}'.format(q))
                #Should we automatically create the object in Agave? Probably not in prod.
                f = AgaveFolderFile.frompath(agave_client = agave_client,
                                             system_id = system_id,
                                             path = path,
                                             username = username)
                f_dict = f.as_meta_json()
                logger.info('Creating metadata {}'.format(f_dict))
                meta_obj = self.call_operation('meta.addMetadata', {'body': f_dict})
                logger.info('Metadata created {}'.format(meta_obj))
        except AgaveException as e:
            logger.error('{}'.e.message)
            raise HTTPError(e.message)
            return None 
        return cls(agave_client = agave_client, meta_obj = meta_obj)

    @classmethod
    def from_file(cls, agave_client = None, f = None, system_id = None, path = None, username = None):
        q = '''{{"name" = "{}", "value.path" = "{}",
                 "value.systemId" = "{}"'''.format(object_name, path + f.name, system_id)
        res = self.call_operation('meta.listMetadata', {'q': q})
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
                'lastUpdated': datetime.date.now(),
                'created': datetime.date.now(),
                'name': object_name,
                'owner': username
            }
        return cls(agave_client = agave_client, meta_obj = d)

    def update(self, new_meta):
        #TODO: push old object into history list
        '''
        q = '{"name": "history", "associationIds":["{}"]'.format(self.uuid)
        history = self.call_operation('meta.listMetadata', {'q': q})
        history.value['history'] += self.as_json()
        self.call_operation('meta.addUpdate', 'body': history)
        '''
        self.association_ids = new_meta.association_ids

        self.deleted = new_meta.deleted
        self.file_type = new_meta.file_type
        self.length = new_meta.length
        self.mime_type = new_meta.mime_type
        self.name = new_meta.name
        self.path = new_meta.path
        self.system_id = new_meta.system_id
        self.keywords = new_meta.keywords
        self.system_tags = new_meta.system_tagas

        self.meta_name = new_meta.meta_name
        self.schema_id = new_meta.schema_id

        self.call_operation('meta.addMetadata', {'body': self.as_meta_json()})
        return self

    #TODO: Updating a file should be put into a queue.
    def upload_file(self, f = None, headers = None):
        data = {
            'fileToUpload': f,
            'filePath': f.path,
            'fileName': f.name
        }
        url = '{}/files/v2/media/system/{}/{}'.format(
            self.agave_client.server_api, self.system_id, self.path)
        resp = requests.post(url, files = data, headers = headers)
        file_obj = AgaveFolderFile(resp)
        file_dict = file_obj.as_meta_json()
        new_meta = AgaveMetaFolderFile(self.agave_client, 
                        meta_obj = {'name': object_name, 
                                    'value': file_dict})
        self.update(new_meta)
        return self

    #TODO: Might want to implement corresponding Encoder/Decoder classes
    def as_json(self):
        return {
           'associationIds': self.association_ids,
           'deleted': self.deleted,
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
                'parentPath': self.parent_path,
                'path': self.path,
                'systemId': self.system_id,
                'keywords': self.keywords,
                'systemTags': self.systemTags
            }
        }

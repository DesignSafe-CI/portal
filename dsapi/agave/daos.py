import datetime
from agavepy.agave import AgaveException
from requests.exceptions import HTTPError
#Data Access Objects to represent data to and from APIs

object_name = 'object'
project_name = 'project'
model_name = 'model'
datetime_format = '%Y-%m-%d %H:%M:%S'

class AgaveObject(object):
    """
    Main class for agave objects
    """

    def __init__(self, agave_client = None, *args, **kwargs):
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
    
    def list_path(self, system_id = None, file_path = None):
        res = self.call_operation('files.list', 
                {'systemId': system_id, 'filePath': file_path})
        ret = [AgaveFolderFile(self.agave_client, file_obj = o) for o in res]
        return ret

    def list_meta_path(self, system_id = None, path = None):
        q = '''{{ "name" = "{}", "value.parentPath" = "{}"
                  "value.systemId" = "{}" }}'''
        res = self.call_operation('meta.listMetadata',
                {'q': q})
        ret = [AgaveMetaFolderFile(agave_client = self.client, 
                    meta_obj = o) for o in res]
        return ret

class AgaveFolderFile(AgaveObject):

    def __init__(self, agave_client = None, file_obj = None, **kwargs):
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
            self.link = file_obj['_links']['self']['href']
            self.meta_link = file_obj['links']['metadata']['href']
        agave_client = kwargs.get('agave_client', None)
        super(AgaveFile, self).__init__(self, agave_client = agave_client, 
                                        *args, **kwargs)

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

    @property
    def parent_path(self):
        path = self.path.split('/')
        path = path[:-1]
        return path

    #TODO: Might want to implement corresponding Encoder/Decoder classes
    def as_json(self):
        return {
            'format': self.format,
            'lastModified': self.last_modified.strftime(datetime_form),
            'length': self.length,
            'mimeType': self.mime_type,
            'name': self.name,
            'path': self.path,
            'permissions': self.permissions,
            'system': self.system,
            'type': self.type,
            'link': self.link,
            'metaLink': self.meta_link
        }

    def as_meta_value_json(self):
        return {
            'deleted': 'false',
            'type': "file" if self.format == 'folder' else 'folder',
            'fileType': self.name.split('.')[-1] if self.format != 'folder' else 'folder',
            'length': self.length,
            'mimeType': self.mime_type,
            'name': self.name,
            'path': self.path,
            'systemId': self.sistem_id,
            'keywords': [],
            'systemTags': {}
        }

class AgaveMetaFolderFile(AgaveObject):
    def __init__(self, agave_client = None, meta_obj = None, **kwargs):
        self.association_ids = meta_obj['associationIds']
        self.deleted = 'false'
        self.file_type = meta_obj['value'].get('fileType', None)
        self.length = meta_obj['value'].get('length', 0)
        self.mime_type = meta_obj['value'].get('mimeType', None)
        self.name = meta_obj['value'].get('name', None)
        self.path = meta_obj['value'].get('path', None)
        self.system_id = meta_obj['value'].get('sistemId', None)
        self.keywords = meta_obj['value'].get('keywords', None)
        self.system_tags = meta_obj.get('systemTags', None)
        self.last_modified = meta_obj['lastUpdated']
        self.created = meta_obj['created']
        self.meta_name = meta_obj['name']
        self.owner = meta_obj['owner']
        self.schema_id = meta_obj['schemaId']
        self.uuid = meta_obj['uuid']
        super(AgaveMetaFolderFile, self).__init__(agave_client = agave_client, **kwargs)
        
    @classmethod
    def frompath(cls, agave_client = None, system_id = None, path = None, username = None):
        d = {}
        if username is None:
            #TODO: raise exception
            return None

        if path is None or path == '/':
            path = username
        try:
            q = '''{{"name" = "{}", "value.path" = "{}", 
                "value.systemId" = "{}"}}'''.format(object_name, path, system_id)
            res = agave_client.meta.listMetadata(q = q);
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
                f_dict = f.as_meta_value_json()
                f_dict['parentPath'] = f.parent_path
                logger.info('AgaveFolderFile: {}'.format(f_dict))
                o = {
                    'name': object_name,
                    'value': f_dict,
                }
                logger.info('Creating metadata {}'.format(o))
                meta_obj = agave_client.meta.addMetadata(body = o)
                logger.info('Metadata created {}'.format(meta_obj))
        except AgaveException as e:
            logger.error('{}'.e.message)
            raise HTTPError(e.message)
            return None 
        return cls(agave_client = agave_client, meta_obj = meta_obj)

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
           'lastModified': self.last_modified.strftime(datetime_format),
           'created': self.created.strftime(datetime_format),
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

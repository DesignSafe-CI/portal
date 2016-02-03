import datetime
#Data Access Objects to represent data to and from APIs

class APIVars(object):
    def __init__(self, *args, **kwargs):
        self.token = kwargs.get('token', None)
        self.access_token = kwargs.get('access_token', None)
        self.agave_url = kwargs.get('agave_url', None)
        self.filesystem = kwargs.get('filesystem', None)
        self.file_path = kwargs.get('file_path', None)
        self.sanitize(username = kwargs.get('username', ''))

    def as_json(self):
        return {
            'agave_url': self.agave_url,
            'filesystem': self.filesystem,
            'file_path': self.file_path
        }

    def sanitize(self, **kwargs):
        if self.file_path is None or self.file_path == u'/':
            self.file_path = '{}/'.format(kwargs.get('username', ''))
        else:
            self.file_path = '{}/{}'.format(kwargs.get('username', file_path))

    def __unicode__(self):
        return 'agave_url: {}\nfilesystem: {}\nfile_path: {}'.format(self.agave_url, self.filesystem, self.file_path)

    def __str__(self):
        return 'agave_url: {}\nfilesystem: {}\nfile_path: {}'.format(self.agave_url, self.filesystem, self.file_path)

class AgaveObject(object):
    """
    Main class for agave objects
    """
    #Class attribute since we assume a project will only use one Agave tennant.
    agave_client = None

    def __init__(self, agave_client, *args, **kwargs):
        self.agave_client = agave_client

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

class AgaveFile(AgaveObject):

    def __init__(self, file_obj = None, *args, **kwargs):
        if file_obj is not None:
            self.format = file_obj['format']
            self.last_modified = file_obj['lastModified']
            self.length = file_obj['length']
            self.mimetype = file_obj['mimeType']
            self.name = file_obj['name']
            self.path = file_obj['path']
            self.permissions = file_obj['permissions']
            self.system = file_obj['system']
            self.type = file_obj['type']
            self.link = file_obj['_links']['self']['href']
            self.meta_link = file_obj['links']['metadata']['href']
        else:
            self.format = kwargs.get('format', 'raw')
            self.last_modified = kwargs.get('las_modified', datetime.datetime.now())
            self.length = kwargs.get('length', 0)
            self.mimetype = kwargs.get('mimetype', 'text')
            self.name = kwargs.get('name', None)
            self.path = kwargs.get('path', '')
            self.permissions = kwargs.get('permissions', 'READ_WRITE')
            self.system = kwargs.get('filesystem', '')
            self.type = kwargs.get('type', 'file')
            self.link = None
            if name is None:
                name = 'file'
                #TODO: raise custom exception.
        agave_client = kwargs.get('agave_client', None)
        super(AgaveFile, self).__init__(self, agave_client = agave_client, 
                                        *args, **kwargs)

    @property
    def parent_path(self):
        path = self.path.split('/')
        path = path[:-1]
        return path

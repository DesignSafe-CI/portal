
#Data Access Objects to represent data to and from APIs

class APIVars(object):
    def __init__(self, *args, **kwargs):
        self.token = kwargs.get('token', None)
        self.access_token = kwargs.get('access_token', None)
        self.agave_url = kwargs.get('agave_url', None)
        self.filesystem = kwargs.get('filesystem', None)
        self.file_path = kwargs.get('file_path', None)
        self.sanitize(username = kwargs.get('username', ''))

    def toDict(self):
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

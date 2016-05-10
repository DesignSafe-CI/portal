from agavepy.agave import AgaveException, Agave
from agavepy.async import AgaveAsyncResponse, TimeoutError, Error
from designsafe.apps.api.exceptions import ApiException
from designsafe.apps.api.data.agave.agave_object import AgaveObject
from designsafe.apps.api.data.abstract.files import AbstractFile
import os
import logging
import urllib
from datetime import datetime

logger = logging.getLogger(__name__)


class AgaveFile(AbstractFile, AgaveObject):

    source = 'agave'

    def __init__(self, agave_client = None, **kwargs):
        super(AgaveFile, self).__init__(**kwargs)
        self.agave_client = agave_client
        self._trail = None
        if self.name == '.':
            tail, head = os.path.split(self.path) 
            self.name = head

    @classmethod
    def from_file_path(cls, system, username, file_path, agave_client = None, **kwargs):
        listing = self.call_operation('files.list',
                                      systemId=system,
                                      filePath=file_path)
        return cls(agave_client = self.agave_client, 
                   wrap = listing[0], **kwargs)
    @property
    def ext(self):
        return os.path.splitext(self.name)[1]

    @property
    def id(self):
        return os.path.join(self.system, self.path)

    @property
    def parent_path(self):
        path, name = os.path.split(self.path)
        if path == '':
            path = '/'
        return path

    @property
    def trail(self):
        if self._trail is None:
            self._trail = []
            if self.parent_path != '':
                path_parts = self.parent_path.split('/')
                for i, c in enumerate(path_parts):
                    trail_path = path_parts[:i]
                    self._trail.append({
                        'source': self.source,
                        'system': self.system,
                        'id': '/'.join([self.system] + trail_path + [c]),
                        'path': '/'.join(trail_path),
                        'name': c,
                    })

        return self._trail

    def copy(self, path):
        path = urllib.unquote(path)
        #split path arg. Assuming is in the form /file/to/new_name.txt
        tail, head = os.path.split(path)
        #check if we have something in tail.
        #If we don't then we got just the new file name in the path arg.
        if tail == '':
            head = path
        d = {
            'systemId': self.system,
            'filePath': urllib.quote(self.full_path),
            'body': {"action": "copy", "path": head}
        }
        res = self.call_operation('files.manage', **d)
        return self

    def move(self, path):
        path = urllib.unquote(path)
        d = {
            'systemId': self.system,
            'filePath': urllib.quote(self.full_path),
            'body': {"action": "move", "path": path}
        }
        res = self.call_operation('files.manage', **d)
        self.path = path
        return self

    def rename(self, path):
        path = urllib.unquote(path)
        d = {
            'systemId': self.system,
            'fielPath': urllib.quote(self.full_path),
            'body': {"action": "rename", "path": path}
        }
        res = self.call_operation('files.manage', **d)
        self.name = name
        return self

    def to_dict(self, **kwargs):
        return {
            'source': self.source,
            'system': self.system,
            'id': self.id,
            'type': 'folder' if self.type == 'dir' else 'file',
            'path': self.parent_path,
            'name': self.name,
            'ext': self.ext,
            'size': self.length,
            'lastModified': datetime.strftime(self.lastModified, '%Y-%m-%dT%H:%M:%S%z'),
            '_trail': self.trail,
            '_actions': [],
            '_pems': [],
        }

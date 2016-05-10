from agavepy.agave import AgaveException, Agave
from requests.exceptions import HTTPError
from agavepy.async import AgaveAsyncResponse, TimeoutError, Error
from designsafe.apps.api.exceptions import ApiException
from designsafe.apps.api.data.agave.agave_object import AgaveObject
from designsafe.apps.api.data.abstract.files import AbstractFile
import os
import logging
from datetime import datetime

logger = logging.getLogger(__name__)


class AgaveFile(AbstractFile, AgaveObject):

    source = 'agave'

    def __init__(self, agave_client = None, **kwargs):
        super(AgaveFile, self).__init__(**kwargs)
        self.agave_client = agave_client
        self._permissions = None
        self._trail = None
        if self.name == '.':
            tail, head = os.path.split(self.path) 
            self.name = head

    @classmethod
    def from_file_path(cls, system, username, file_path, agave_client = None, **kwargs):
        try:
            logger.debug('Agave: calling: files.list, args: {}'.format( 
                             {'systemId': system, 'filePath': file_path}))
            listing = agave_client.files.list(systemId=system, filePath= file_path)
        except (AgaveException, HTTPError) as e:
            logger.error(e,
                exc_info = True,
                extra = kwargs)
            d = {'operation': 'files.list'}
            d.update({'systemId': system, 'filePath': file_path})
            raise ApiException(e.message,
                        e.response.status_code,
                        extra = d)

        return cls(agave_client = agave_client, 
                   wrap = listing[0], **kwargs)

    @classmethod
    def mkdir(cls, system, username, file_path, path, agave_client = None, **kwargs):
        pat = path
        tail, head = os.path.split(path)
        body = '{{"action": "mkdir", "path": "{}"}}'.format(head)
        try:
            logger.debug('Agave: calling: files.manage, args: {}'.format( 
                             {'systemId': system, 'filePath': file_path,
                              'body': body}))
            f = agave_client.files.manage(systemId=system, filePath=file_path, 
                                                body = body)
        except (AgaveException, HTTPError) as e:
            logger.error(e,
                exc_info = True,
                extra = kwargs)
            d = {'operation': 'files.list'}
            d.update({'systemId': system, 'filePath': file_path, 'body': body})
            raise ApiException(e.message,
                        e.response.status_code,
                        extra = d)
        return cls.from_file_path(system, username, path, agave_client = agave_client)

    @property
    def ext(self):
        return os.path.splitext(self.name)[1]

    @property
    def full_path(self):
        return self.path

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
    def permissions(self):
        if self._permissions is None:
            pems = self.call_operation('files.listPermissions', 
                        filePath = self.full_path, systemId = self.system)
            self._permissions = pems

        return self._permissions

    @property
    def trail(self):
        if self._trail is None:
            self._trail = []
            if self.parent_path != '' and self.parent_path != '/':
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
        """
        Copy a file.

        Args:
            path: String. Path to copy the file into.

        Notes:
            `path` should be the entire path where the copy should go.
            TODO: Sanitize path
        """
        d = {
            'systemId': self.system,
            'filePath': self.full_path,
            'body': {"action": "copy", "path": path}
        }
        res = self.call_operation('files.manage', **d)
        return self

    def delete(self):
        res = self.call_operation('files.delete',
            systemId = self.system,
            filePath = self.full_path)
        return self

    def move(self, path):
        """
        Move a file to another path.

        Args:
            path: String. New path to move the file.

        Notes:
            `path` should be the complete path to move the file into.
            Should contain the file's name.
        """
        path = path
        d = {
            'systemId': self.system,
            'filePath': self.full_path,
            'body': {"action": "move", "path": path}
        }
        res = self.call_operation('files.manage', **d)
        self.path = path
        return self

    def rename(self, path):
        """
        Rename file

        Args:
            path: String. New file name

        Notes:
            `path` should only be the new name of the file
            and not the entire path. 
            TODO: Sanitize path.
        """
        d = {
            'systemId': self.system,
            'filePath': self.full_path,
            'body': {"action": "rename", "path": path}
        }
        res = self.call_operation('files.manage', **d)
        tail, head = os.path.split(self.path)
        self.path = os.path.join(tail, path)
        self.name = path
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

import logging
import os
from datetime import datetime

from agavepy.agave import AgaveException
from requests.exceptions import HTTPError

from designsafe.apps.api.data.abstract.files import AbstractFile
from designsafe.apps.api.data.agave.agave_object import AgaveObject
from designsafe.apps.api.exceptions import ApiException

logger = logging.getLogger(__name__)


class AgaveFile(AbstractFile, AgaveObject):
    """
    Agave File class
    """

    source = 'agave'

    SUPPORTED_IMAGE_PREVIEW_EXTS = [
        '.png', '.gif', '.jpg', '.jpeg',
    ]

    SUPPORTED_TEXT_PREVIEW_EXTS = [
        '.as', '.as3', '.asm', '.bat', '.c', '.cc', '.cmake', '.cpp', '.cs', '.css',
        '.csv', '.cxx', '.diff', '.groovy', '.h', '.haml', '.hh', '.htm', '.html',
        '.java', '.js', '.less', '.m', '.make', '.md', '.ml', '.mm', '.msg', '.php',
        '.pl', '.properties', '.py', '.rb', '.sass', '.scala', '.script', '.sh', '.sml',
        '.sql', '.txt', '.vi', '.vim', '.xml', '.xsd', '.xsl', '.yaml', '.yml', '.tcl',
        '.json', '.out', '.err',
    ]

    SUPPORTED_OBJECT_PREVIEW_EXTS = [
        '.pdf',
    ]

    SUPPORTED_PREVIEW_EXTENSIONS = (SUPPORTED_IMAGE_PREVIEW_EXTS +
                                    SUPPORTED_TEXT_PREVIEW_EXTS +
                                    SUPPORTED_OBJECT_PREVIEW_EXTS)

    def __init__(self, agave_client = None, **kwargs):
        super(AgaveFile, self).__init__(**kwargs)
        self.agave_client = agave_client
        self._trail = None
        if self._wrap and 'permissions' in self._wrap:
            self._permissions = self._wrap['permissions']

        if self.name == '.':
            tail, head = os.path.split(self.path) 
            self.name = head

    @classmethod
    def from_file_path(cls, system, username = None, file_path = None, agave_client = None, **kwargs):
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
    def listing(cls, system, file_path, agave_client):
        try:
            logger.debug('Agave: calling: files.list, args: {}'.format( 
                         {'systemId': system, 'filePath': file_path}))
            listing = agave_client.files.list(systemId = system, filePath = file_path)
        except (AgaveException, HTTPError) as e:
            logger.error(e, exc_info = True,)
            d = {'operation': 'files.list'}
            d.update({'systemId': system, 'filePath': file_path})
            raise ApiException(e.message,
                        e.response.status_code,
                        extra = d)
        
        return [AgaveFile(wrap = o, agave_client = agave_client) for o in listing]

    @classmethod
    def mkdir(cls, system, username, file_path, dir_name, agave_client = None, **kwargs):
        body = '{{"action": "mkdir", "path": "{}"}}'.format(dir_name)
        try:
            logger.debug('Agave: calling: files.manage, args: {}'.format( 
                             {'systemId': system, 'filePath': file_path,
                              'body': body}))
            f = agave_client.files.manage(systemId=system, filePath=file_path, body=body)
        except (AgaveException, HTTPError) as e:
            logger.error(e, exc_info=True, extra=kwargs)
            d = {'operation': 'files.list'}
            d.update({'systemId': system, 'filePath': file_path, 'body': body})
            raise ApiException(e.message, e.response.status_code, extra = d)

        dir_path = os.path.join(file_path, dir_name)
        return cls.from_file_path(system, username, dir_path, agave_client=agave_client)

    @property
    def previewable(self):
        return self.ext in self.SUPPORTED_PREVIEW_EXTENSIONS

    def create_postit(self, force=True):
        url = self._links['self']['href']
        if force:
            url += '?force=true'
        body = {
            'url': url,
            'maxUses': 1,
            'method': 'GET',
            'lifetime': 60,
            'noauth': False
        }
        return self.call_operation('postits.create', body=body)

    def download(self):
        # TODO can't apply range headers in AgavePy. Use requests raw?
        resp = self.call_operation('files.download',
                                   systemId=self.system,
                                   filePath=self.full_path,
                                   # headers={'Range': 'bytes=0-4096'},
                                   )
        return resp.content

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
        """
        Agave file permissions

        Returns:
            Array of dicts with permissions details.

        Notes:
            The permissions are stored in the instance. If there are no permissions
            an agave call to `files.listPermissions` is executed and the result
            is stored in the instance and returned.
            If it's necessary to force a reload on the permissions then
            the attribute `_permissions` can be set to None.

            >>> f._permissions = None
            >>> #Next time we access .permissions a call to agave will be made.
            >>> print f.permissions #reloaded permissions from agave.
        """
        if self._permissions is None:
            pems = self.call_operation('files.listPermissions', 
                        filePath = self.full_path, systemId = self.system)
            self._permissions = pems

        return self._permissions

    @property
    def trail(self):
        """
        A trail is a list of dictionary objects. Each of these dict objects
        have enough information of the folder breadcrumb of the current file
        to access it throuh another API call.

        Examples:
            Get the AgaveFile class instance of the parent directory:
            >>> f = AgaveFile.from_file_path(system = 'system.id',
            >>>              file_path = 'path/to/file.txt', agave_client = ac)
            >>> parent_trail = f.trail[-1]
            >>> parent_folder = AgaveFile.from_file_path(system = parent_trail['system'], 
            >>>             file_path = parent_trail['path'], agave_client = ac)
            
            Construct the parent folder agave URI to submit as a job input
            >>> f = AgaveFile.from_file_path(system = 'system.id',
            >>>              file_path = 'path/to/file.txt', agave_client = ac)
            >>> parent_trail = f.trail[-1]
            >>> agave_uri = '{}://{}/{}'.format(parent_trail['source'], parent_trail['system'],
            >>>                                 parent_trail['path'])

        Returns:
            A list of dicts
        """
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

        Returns:
            Class instance for chainability

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
        """
        Deletes a file
        
        Returns:
            Class instance for chainability
        """
        res = self.call_operation('files.delete',
            systemId = self.system,
            filePath = self.full_path)
        return self

    def move(self, path):
        """
        Move a file to another path.

        Args:
            path: String. New path to move the file.

        Returns:
            Class instance for chainability

        Notes:
            `path` should be the complete path to move the file into.
            Should contain the file's name.
        """
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

        Returns:
            Class instance for chainability

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

    def share(self, user_to_share, permission):
        """
        Share file(s)

        Args:
            user_to_share: String. User to share the file(s) with.
            permission: String. Permission to set [READ | WRITE | EXECUTE | ALL]

        Returns:
            Class instance for chainability
        """
        permission_body = '{{ "recursive": "true", "permission": "{}", "username": "{}" }}'.format(permission, user_to_share)
        try:
            self.call_operation('files.updatePermissions',
                                filePath = self.full_path,
                                systemId = self.system,
                                body = permission_body, 
                                raise_agave = True)
        except (AgaveException, HTTPError) as e:
            logger.error('{}: Couldn\'t update permissions {}'.format(e.message, permission_body))

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

    def __repr__(self):
        return 'AgaveFile(wrap={{ "system": "{}", "path": "{}", "name": "{}"}})'.format(getattr(self, 'system', ''), getattr(self, 'path', ''), getattr(self, 'name', ''))
    
    def __str__(self):
        return '{}://{}/{}'.format(self.source, getattr(self, 'system', ''), getattr(self, 'path', ''))

    def __unicode__(self):
        return unicode(self.__str__)

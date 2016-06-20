import logging
import os
import urllib2
from datetime import datetime
import dateutil.parser

from agavepy.agave import AgaveException
from requests.exceptions import HTTPError

from designsafe.apps.api.data.abstract.files import AbstractFile
from designsafe.apps.api.data.agave.agave_object import AgaveObject
from designsafe.apps.api.exceptions import ApiException

logger = logging.getLogger(__name__)


class AgaveFile(AbstractFile, AgaveObject):
    """
    Agave File class

    This class takes care of everything needed to correctly
    call the agave filesystem endpoint. This class also wraps
    a dict with all the information for a file.

    :attr object agave_client: :class:`~agavepy.agave.Agave` object to call Agave.
    :attr list _trail: list of dict with information of the path trail for a file.
    :attr dict _wrap: dict where the data is stored.

    Wrap:
    -----

        This class wraps a dict object which holds all the data for a file.
        The dict object is a response from an agave call to `files.listing`.
        This wrapping makes the code look cleaner and more efficient. 
        Accessing the data in the wrapped dict object works just by using 
        a dict's key as if it were an attribute of this class. This is done
        by overwriting the `__getattr__` method, done in 
        :class:`~designsafe.apps.api.agave.agave_object.AgaveObject`.
        This means that if the dict object stored in `_wrap` has a key `lastModified`
        then one could access this value using `af.lastModified` or `af._wrap['lastModified']`

        There is some extra sugar on the `_wrap` dict access implementation. A underscore
        to camelcase conversion happens in order to be able to acces values using
        a more pythonic way. This means that one could also access the `lastModified` value
        by using `af.last_modified`.
    """

    DEFAULT_SOURCE = 'agave'

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
        self.source = kwargs.pop('source', self.DEFAULT_SOURCE)
        self.agave_client = agave_client
        self._trail = None
        self._permissions = None
        if self._wrap and 'permissions' in self._wrap and not isinstance(self._wrap['permissions'], basestring):
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

        return cls(agave_client = agave_client, wrap = listing[0], **kwargs)

    @classmethod
    def listing(cls, system, file_path, agave_client, **kwargs):
        try:
            logger.debug('Agave: calling: files.list, args: {}'.format( 
                         {'systemId': system, 'filePath': file_path}))
            limit = kwargs.pop('limit', 100)
            offset = kwargs.pop('offset', 0)
            listing = agave_client.files.list(systemId=system, filePath=file_path,
                                              limit=limit, offset=offset)
        except (AgaveException, HTTPError) as e:
            logger.error(e, exc_info = True,)
            d = {'operation': 'files.list'}
            d.update({'systemId': system, 'filePath': file_path})
            raise ApiException(e.message,
                        e.response.status_code,
                        extra = d)
        
        return [cls(wrap = o, agave_client = agave_client, **kwargs) for o in listing]

    @classmethod
    def mkdir(cls, system, username, file_path, dir_name, agave_client = None, **kwargs):
        body = '{{"action": "mkdir", "path": "{}"}}'.format(dir_name)
        try:
            logger.debug('Agave: calling: files.manage, args: {}'.format(
                             {'systemId': system, 'filePath': file_path,
                              'body': body}))
            agave_client.files.manage(systemId=system, filePath=file_path, body=body)
            dir_path = os.path.join(file_path, dir_name)
            return cls.from_file_path(system, username, dir_path, agave_client)
        except (AgaveException, HTTPError) as e:
            logger.error(e, exc_info=True, extra=kwargs)
            d = {'operation': 'files.list'}
            d.update({'systemId': system, 'filePath': file_path, 'body': body})
            raise ApiException(e.message, e.response.status_code, extra = d)

    @property
    def ext(self):
        return os.path.splitext(self.name)[1]

    @property
    def full_path(self):
        return self.path

    @property
    def id(self):
        return os.path.join(self.system, self.path.strip('/'))

    @property
    def parent_path(self):
        path, name = os.path.split(self.path.strip('/'))
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
        if not self._permissions:
            pems = self.call_operation('files.listPermissions',
                                       filePath=self.full_path,
                                       systemId=self.system)
            self._permissions = pems
        return self._permissions

    @property
    def previewable(self):
        return self.ext.lower() in self.SUPPORTED_PREVIEW_EXTENSIONS

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
                        'type': 'folder'
                    })

        return self._trail

    def _user_has_access(self, username, file_name_filter = None, pem = 'read'):
        """Checks if username has access to a child file

        Given a username check if there is any child file 
        (on the first immeidate level) that has the permission `pem` set.
        If a ``file_name_filter`` is given the function will check any 1st children
        filtering out the file with the specified file name.
        If a ``pem`` is given the function will check for that specific permission.

        Args:
            username (string): Username to check permission.
            file_name_filter (string): File name to filter out when checking for permissions.
            pem (string): String representation of permission to look for. 
                Please refer to :func:`update_pems` for alowed strings. Defaults to READ.
        Returns:
            bool: True or False if the permission for the given username was found.

        Note:
            This method should be used whenever a permission for a given username is revoked
            in order to decide if the permission revoke should be reflected on the parent
            path or any other files. Meaning, if a username has read access to `path/to/file`
            and `path/to/another_file` and the read permission is revoked on `path/to/file`
            we would not want to also revoke read permission on `path/to` or the username
            will not be able to see `path/to/another_file`.
        
        Note:
            If the current class instance is a representation of a file and not a directory
            i.e. it does not have any children, the function will analyze the current
            file's permissions.

        """
        if self.type != 'dir':
            username_pems = filter(lambda x: x['username'] == username, self.permissions)
            check = username_pems['permission'][pem]
        else:
            listing = AgaveFile.listing(self.system, 
                                        file_path = self.full_path,
                                        agave_client = self.agave_client)
            check = False
            for o in listing:
                if (file_name_filter is not None and o.name == file_name_filter) or o.name == self.name:
                    continue

                pems = o.permissions
                username_pems = filter(lambda x: x['username'] == username, pems)
                logger.debug('username_pems: {} on file: {}'.format(username_pems, o.full_path))
                if len(username_pems) > 0 and username_pems[0]['permission'][pem]:
                    check = True
                    break

        return check

    def copy(self, path):
        """
        Copy a file.

        Args:
            path: String. Path to copy the file into.

        Returns:
            Class instance for chainability

        Notes:
            `path` should be the name of the copied file.
        """
        d = {
            'systemId': self.system,
            'filePath': self.full_path,
            'body': {"action": "copy", "path": path}
        }
        copy_wrap = self.call_operation('files.manage', **d)
        
        tail, head = os.path.split(path)
        copy_wrap['length'] = self.length
        copy_wrap['lastModified'] = dateutil.parser.parse(copy_wrap['lastModified'])
        copy_wrap['format'] = unicode(self.format)
        copy_wrap['type'] = unicode(self.type)
        copy_wrap['system'] = unicode(self.system)
        copy_wrap['mimeType'] = unicode(self.mime_type)
        copy_wrap['name'] = unicode(head)
        copy_wrap['path'] = unicode(path)
        copy_wrap['permissions'] = []
        ret = AgaveFile(wrap = copy_wrap, agave_client = self.agave_client)
        return ret

    def create_postit(self, force=True, max_uses=10, lifetime=600):
        url = urllib2.unquote(self._links['self']['href'])
        if force:
            url += '?force=true'
        body = {
            'url': url,
            'maxUses': max_uses,
            'method': 'GET',
            'lifetime': lifetime,
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

        Examples:
            >>> agave_file = AgaveFile.from_file_path(system = 'agave.system.id',
            ...              'path/to/file.txt',
            ...              agave_client = ac)
            >>> agave_file.move('path/to/new folder/file.txt')

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

    def share(self, pems_args, update_parent_path = True, recursive = True):
        """Share and/or un-share file(s)

        This function takes a list as an argument. This list should be a list 
        of :class:`dict` objects with two keys ``user_to_share`` and ``permission``.


        Args:
            pems_args (list): A list of dicts with two keys ``user_to_share`` and ``permission``.
            update_parent_path (bool): If ``True`` update the permission on the parent path.

        Returns:
            Class instance for chainability
        """
        for pem in pems_args:
            self.update_pems(pem['user_to_share'], pem['permission'], recursive)
        
        if update_parent_path:
            self._update_pems_on_parent_path(pems_args)

        return self

    def _filter_revoke_pems_list(self, pems_args):
        """Filter out any revoke pems when not needed

        This function will remove any revoke permissions if the username,
        whose permission we wish to revoke, still has access to another
        file/folder in the home directory.

        Args:
            pems_args (list): list of permissions arguments. Refer to :func:`share`

        Returns:
            list: The same ``pems_args`` except filtered.

        Note:
            The decision to filter out permission revoke is based only on the rest of
            the permission in the first level of the home directory. This is because
            if a user has any access to a file that is deep in the file system tree
            those permissions should be reflected in, at least, one directory on the
            first level.                
        """
        owner = self.parent_path.split('/')[0]
        revoke = filter(lambda x: x['permission'] == 'NONE', pems_args)
        logger.debug('revoke: {}'.format(revoke))
        if len(revoke) > 0:
            revoke_usernames = [o['user_to_share'] for o in revoke]
            home_dir= AgaveFile.from_file_path(self.system, owner,
                                            owner, self.agave_client)
            if self.parent_path == owner:
                file_name_filter = self.name
            else:
                file_name_filter = None
            for username in revoke_usernames:
                logger.debug('Checking username: {} for permissions'.format(username)) 
                if home_dir._user_has_access(username, file_name_filter = file_name_filter):
                    pems_args = filter(lambda x: x['user_to_share'] != username, pems_args)

        return pems_args

    def _update_pems_on_parent_path(self, pems_args):
        """Update permissions on all the parent folders
        """
        pems_args = self._filter_revoke_pems_list(pems_args)
        if len(pems_args) == 0:
            return False

        path_comps = self.parent_path.split('/')
        parents_pems_args = []
        for p in pems_args:
            d = {'user_to_share': p['user_to_share'],
                 'permission': 'READ' if p['permission'] != 'NONE' else 'NONE'
                }
            parents_pems_args.append(d)
        for i in range(len(path_comps)):
            file_path = u'/'.join(path_comps)
            logger.debug('Agave updating pems on parent: %s' % file_path)
            af = AgaveFile.from_file_path(self.system, self.parent_path.split('/')[0], 
                                    file_path, self.agave_client)
            af.share(parents_pems_args, update_parent_path = False, recursive = False)
            path_comps.pop()
        return True

    def update_pems(self, username_to_update, permission, recursive = True):
        """Update permissions.
        
        Args:
            username_to_update (string): Username whose permissions we are 
                going to update
            permission (string): New permission.
                [READ | WRITE | EXECUTE | READ_WRITE | READ_EXECUTE | WRITE_EXECUTE | ALL | NONE]
        Returns:
            Class instasnce for chainability
        """
        permission_body = '{{ "recursive": "{}", "permission": "{}", "username": "{}" }}'.format(
                                                         recursive, permission, username_to_update)
        try:
            self.call_operation('files.updatePermissions',
                                filePath = self.full_path,
                                systemId = self.system,
                                body = permission_body, 
                                raise_agave = True)
        except AgaveException as e:
            logger.error('{}: Could not update permissions {}'.format(e.message, permission_body))
        except HTTPError as e:
            if e.response.status_code == 502 or e.response.status_code == 503:
                logger.error('{}: Could not update permissions {}'.format(e.message, permission_body))
            else:
                raise
        return self

    def to_dict(self, default_pems = None, extra = {}, **kwargs):
        """Converts a file object into a serializable dictionary.

        :param list default_pems: A list of dicts representing some default permissions.
            This is useful when retreiving permissions from Agave is not necessary and
            the permissions can be constructed from existent information.
        :param dict extra: A dictionary with keys and values to add to the dict returned
            by this function. 
        """
        pems = default_pems
        if pems is None:
            pems = self.permissions

        d = {
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
            '_pems': pems,
        }
        d.update(extra)
        return d

    def __repr__(self):
        return 'AgaveFile(wrap={{ "system": "{}", "path": "{}", "name": "{}"}})'.format(getattr(self, 'system', ''), getattr(self, 'path', ''), getattr(self, 'name', ''))
    
    def __str__(self):
        return '{}://{}/{}'.format(self.source, getattr(self, 'system', ''), getattr(self, 'path', ''))

    def __unicode__(self):
        return unicode(self.__str__)

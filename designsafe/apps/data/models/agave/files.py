import json
import logging
import re
import os
import six
import urllib.request
import urllib.parse
import urllib.error
import urllib.parse
from requests.exceptions import HTTPError
from designsafe.apps.data.models.agave.base import BaseAgaveResource
from designsafe.apps.data.models.agave.metadata import BaseMetadataResource, BaseMetadataPermissionResource
from designsafe.apps.data.models.agave.systems import roles as system_roles_list
from agavepy.agave import AgaveException
from agavepy.async import AgaveAsyncResponse, TimeoutError, Error
from designsafe.apps.api import tasks

logger = logging.getLogger(__name__)


class BaseFileMetadata(BaseMetadataResource):
    """
    Base class for Agave File Metadata
    """
    NAME = 'designsafe.file'

    def __init__(self, agave_client, file_obj=None, **kwargs):
        meta_objs = []
        if file_obj:
            query = '{{"associationIds": "{}", "name": "designsafe.file"}}'.format(file_obj.uuid)
            meta_objs = agave_client.meta.listMetadata(q=query)
            logger.info(meta_objs)
            if meta_objs:
                defaults = meta_objs[0]
            if not meta_objs:
                defaults = kwargs
                defaults['name'] = 'designsafe.file'
                defaults['value'] = {'fileUuid': file_obj.uuid,
                                     'keywords': []}
                defaults['associationIds'] = [file_obj.uuid]

            project_uuid = kwargs.get('project_uuid')
            if re.search(r'^project-', file_obj.system) or project_uuid:
                project_uuid = project_uuid or file_obj.system.replace('project-', '', 1)
                defaults['value'].update({'projectUuid': project_uuid})
                defaults['associationIds'].append(project_uuid)
        else:
            defaults = kwargs
        super(BaseFileMetadata, self).__init__(agave_client, **defaults)

    @classmethod
    def search(cls, agave_client, q):
        if isinstance(q, dict):
            q = json.dumps(q)
        result = agave_client.meta.listMetadata(q=q)
        return [cls(agave_client=agave_client, file_obj=None, **r) for r in result]

    def update(self, metadata):
        keywords = metadata.get('keywords', '')
        keywords = [kw.strip() for kw in keywords]
        keywords = list(set(keywords))
        self.value['keywords'] = keywords
        self.save()
        return self

    def _update_pems_with_system_roles(self, system_roles, meta_pems):
        """Updates this metadata object's permissions with those of a system's roles

            :param list system_roles: A list of :class:`dict` representing the user roles of a system.
             This should be the response from :func:`~agavepy.agave.Agave.systems.listRoles`.
            :param list meta_pems: A list of
             :class:`~designsafe.apps.data.models.agave.metadata.BaseMetadataPermissionResource`.
             This should be the response from
             :func:`~designsafe.apps.data.models.agave.metadata.BaseMetadataPermissionResource.list_permissions`

            :returns: A :class:`dict` where the keys are the usernames who do not have a role set on the system and the value
             of each key is the :class:`~designsafe.apps.data.models.agave.metadata.BaseMetadataPermissionResource` object.
            :rtype: dict
        """
        meta_pems_users = {pem.username: pem for pem in meta_pems}
        for role_obj in system_roles:
            username = role_obj['username']
            role = role_obj['role']
            try:
                pem = meta_pems_users.pop(username)
            except KeyError:
                pem = BaseMetadataPermissionResource(self.uuid, self._agave)
                pem.username = username

            if role == system_roles_list.GUEST and \
                    (not pem.read or pem.write):
                pem.read = True
                pem.save()
                logger.debug('Created or Updated %s', pem)
            elif role == system_roles_list.USER and \
                    (not pem.read or pem.write):
                pem.read = True
                pem.write = True
                pem.save()
                logger.debug('Created or Updated %s', pem)

        return meta_pems_users

    def match_pems_to_project(self, project_uuid=None):
        project_uuid = project_uuid or self.value.get('projectUUID', self.value.get('projectUuid'))
        logger.debug('matchins pems to project: %s', project_uuid)
        if not project_uuid:
            return self

        project_roles = self._agave.systems.listRoles(systemId='project-{}'.format(project_uuid))
        project_roles = [x for x in project_roles if x['username'] != 'ds_admin']
        meta_pems = BaseMetadataPermissionResource.list_permissions(self.uuid, self._agave)
        meta_pems_users = self._update_pems_with_system_roles(project_roles, meta_pems)
        for username, pem in six.iteritems(meta_pems_users):
            pem.delete()

        return self

    def save(self):
        if self.uuid is None:
            super(BaseFileMetadata, self).save()
            # self.match_pems_to_project()
            if self.value.get('projectUUID'):
                tasks.check_project_meta_pems.apply_async(args=[self.uuid], queue='api')
        else:
            super(BaseFileMetadata, self).save()


class BaseFileResource(BaseAgaveResource):
    """Represents an Agave Files API Resource"""

    SUPPORTED_MS_WORD = [
        '.doc', '.dot', '.docx', '.docm', '.dotx', '.dotm', '.docb',
    ]
    SUPPORTED_MS_EXCEL = [
        '.xls', '.xlt', '.xlm', '.xlsx', '.xlsm', '.xltx', '.xltm',
    ]
    SUPPORTED_MS_POWERPOINT = [
        '.ppt', '.pot', '.pps', '.pptx', '.pptm', '.potx', '.ppsx', '.ppsm', '.sldx', '.sldm',
    ]

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

    SUPPORTED_VIDEO_EXTS = [
        '.webm', '.ogg', '.mp4'
    ]

    SUPPORTED_VIDEO_MIMETYPES = {
        '.webm': 'video/webm',
        '.ogg': 'video/ogg',
        '.mp4': 'video/mp4'
    }

    SUPPORTED_MS_OFFICE = SUPPORTED_MS_WORD + SUPPORTED_MS_POWERPOINT + SUPPORTED_MS_EXCEL

    SUPPORTED_PREVIEW_EXTENSIONS = (SUPPORTED_IMAGE_PREVIEW_EXTS +
                                    SUPPORTED_TEXT_PREVIEW_EXTS +
                                    SUPPORTED_OBJECT_PREVIEW_EXTS +
                                    SUPPORTED_MS_OFFICE)

    def __init__(self, agave_client, system, path, **kwargs):
        super(BaseFileResource, self).__init__(agave_client, system=system, path=path,
                                               **kwargs)
        self._children = None
        self._metadata = None
        self._trail = None

    def __str__(self):
        return self.id

    def __repr__(self):
        return '<BaseAgaveFile: {}>'.format(self._links['self']['href'])

    @property
    def agave_uri(self):
        return 'agave://{}/{}'.format(self.system, self.path)

    @property
    def id(self):
        return '/'.join([self.system, self.path])

    @property
    def children(self):
        if self.type == 'dir' and self._children is None:
            listing = self.listing(self._agave, self.system, self.path)
            self._children = listing._children
        return self._children

    @children.setter
    def children(self, value):
        self._children = value

    @property
    def ext(self):
        return os.path.splitext(self.name)[1].lower()

    @property
    def previewable(self):
        return self.ext in self.SUPPORTED_PREVIEW_EXTENSIONS

    @property
    def trail(self):
        """
        Parses the path of the file to return a list of dicts representing the paths/files
        that progressively lead up to this file. For example, if the file has the path::

            /foo/bar/bin/file.txt

        then the trail will be::

            [
                {'path': '/', 'name': '/', 'system: '...'},
                {'path': '/foo', 'name': 'foo', 'system: '...'},
                {'path': '/foo/bar', 'name': 'bar', 'system: '...'},
                {'path': '/foo/bar/bin', 'name': 'bin', 'system: '...'},
                {'path': '/foo/bar/bin/file.txt', 'name': 'file.txt', 'system: '...'},
            ]

        :return: The file trail
        :rtype:
        """
        if self._trail:
            return self._trail

        path_comps = self.path.split('/')

        # the first item in path_comps is '', which represents '/'
        trail_comps = [{'name': path_comps[i] or '/',
                        'system': self.system,
                        'path': '/'.join(path_comps[0:i + 1]) or '/',
                        } for i in range(0, len(path_comps))]
        return trail_comps

    @trail.setter
    def trail(self, value):
        self._trail = value

    @property
    def metadata(self):
        try:
            if self._metadata is None:
                self._metadata = BaseFileMetadata(self._agave, self)

            return self._metadata
        except Exception as exc:
            logger.debug('Couldn\'t get metadata %s', exc)

    @property
    def uuid(self):
        """
        In the files `_links` is an href to metadata via associationIds. The
        `associationId` is the UUID of this file. Use urlparse to parse the URL and then
        the query. The `q` query parameter is a JSON string in the form::

            {"assocationIds": "{{ uuid }}"}

        :return: string: the UUID for the file
        """
        try:
            if 'metadata' in self._wrapped['_links']:
                assoc_meta_href = self._links['metadata']['href']
                parsed_href = urllib.parse.urlparse(assoc_meta_href)
                query_dict = urllib.parse.parse_qs(parsed_href.query)
                if 'q' in query_dict:
                    meta_q = json.loads(query_dict['q'][0])
                    return meta_q.get('associationIds')
            return None
        except Exception as exc:
            logger.debug('Couldn\'t get uuid %s', exc)

    def to_dict(self):
        ser = super(BaseFileResource, self).to_dict()
        if self._children is not None:
            ser['children'] = [c.to_dict() for c in self._children]

        ser['trail'] = self.trail
        return ser

    def import_data(self, from_system, from_file_path):
        remote_url = 'agave://{}/{}'.format(from_system, urllib.parse.quote(from_file_path))
        file_name = os.path.split(from_file_path)[1]
        logger.debug('SystemId: %s, filePath: %s, fileName: %s, urlToingest: %s',
                     self.system, self.path, file_name, remote_url)
        result = self._agave.files.importData(systemId=self.system,
                                              filePath=urllib.parse.quote(self.path),
                                              fileName=str(file_name),
                                              urlToIngest=remote_url)
        async_resp = AgaveAsyncResponse(self._agave, result)
        async_status = async_resp.result(600)

        if async_status == 'FAILED':
            logger.error('Import Data failed; from: %s/%s' % (from_system, from_file_path))

        return BaseFileResource.listing(self._agave, self.system, result['path'])

    def copy(self, dest_path, file_name=None):
        """
        Copies the current file to the provided destination path. If new_name is provided
        the copied file will be renamed as that. If new_name is not provided then the file
        will be copied with the same name.
        :param str dest_path: The full path to the destination directory. This path must
            exist on the same system as the original file.
        :param str file_name: (optional) The name for the copied file. Defaults to the
            same name as the original file.
        :return: The copied file.
        :rtype: :class:`BaseFileResource`
        """
        if file_name is None:
            file_name = self.name

        body = {'action': 'copy', 'path': '/'.join([dest_path, file_name])}
        copy_result = self._agave.files.manage(systemId=self.system,
                                               filePath=urllib.parse.quote(self.path),
                                               body=body)
        return BaseFileResource.listing(self._agave, self.system, copy_result['path'])

    def delete(self):
        """
        Removes this file from the remote system.
        :return: None
        """
        return self._agave.files.delete(systemId=self.system,
                                        filePath=urllib.parse.quote(self.path))

    @classmethod
    def ensure_path(cls, agave_client, system, path):
        """
        Ensures that the given path exists. Creates any missing directories.

        :param agavepy.agave.Agave agave_client: Agave API client for the acting user
        :param str system: The Agave system ID where this file path exists
        :param str path: The full path to ensure
        :return: The file representing the deepest ensured directory
        :rtype: :class:`BaseFileResource`
        """
        path_comps = path.split('/')
        ensured_path = path_comps[0] or '/'

        path_index_start = 1
        try:
            ensure_result = cls.listing(agave_client, system, ensured_path)
        except HTTPError as err:
            if err.response.status_code == 400 or err.response.status_code == 403\
                    and len(path_comps) >= 2:
                ensured_path = path_comps[1]
                path_index_start = 2
                ensure_result = cls.listing(agave_client, system, ensured_path)
            else:
                raise

        for pc in path_comps[path_index_start:]:
            checked = ensure_result.mkdir(pc)
            ensured_path = os.path.join(ensured_path, pc)
            ensure_result = checked
        return ensure_result

    def history(self):
        history = self._agave.files.getHistory(systemId=self.system,
                                               filePath=urllib.parse.quote(self.path))
        return [BaseAgaveFileHistoryRecord(self._agave, **h) for h in history]

    def list_permissions(self, username=None):
        """
        List permissions for this File. If username is provided, returns only permissions
        for that user, otherwise returns all permissions.
        :param str username: A user to restrict the permissions listing results.
        :return: A list of BaseAgaveFilePermission
        :rtype: list[BaseFilePermissionResource]
        """
        return BaseFilePermissionResource.list_permissions(self._agave, self, username)

    @classmethod
    def listing(cls, agave_client, system, path, offset=0, limit=100):
        """
        List the File for the given systen and path.

        :param agavepy.agave.Agave agave_client: Agave API client for the acting user
        :param str system: The Agave system ID where this file path exists
        :param str path: The path to the file
        :return: The file
        :rtype: :class:`BaseFileResource`
        :raises HTTPError: If an error occurs.

            - 403 If the user represented by the passed ``agave_client`` does not have
                READ permission on ``path`` on ``system``.
            - 404 If the ``path`` does not exist on ``system``.
        """
        lower = 1
        if offset > 0:
            lower = 0

        list_result = agave_client.files.list(systemId=system,
                                              filePath=urllib.parse.quote(path),
                                              offset=offset,
                                              limit=limit)
        listing = cls(agave_client=agave_client, **list_result[0])
        if listing.type == 'dir' or offset:
            # directory names display as "." from API
            listing.name = os.path.basename(listing.path)

            # put rest of listing as ``children``
            listing._children = [cls(agave_client=agave_client, **f)
                                 for f in list_result[lower:]]
        return listing

    def download(self):
        resp = self._agave.files.download(systemId=self.system,
                                          filePath=urllib.parse.quote(self.path))
        return resp.content

    def download_postit(self, force=True, max_uses=10, lifetime=600):
        args = {
            'url': urllib.parse.unquote(self._links['self']['href']),
            'maxUses': max_uses,
            'method': 'GET',
            'lifetime': lifetime,
            'noauth': False
        }
        if force:
            args['url'] += '?force=True'
        result = self._agave.postits.create(body=args)
        return result['_links']['self']['href']

    def mkdir(self, dir_name):
        """
        Create a new directory inside this directory with the name ``dir_name``.

        :param str dir_name: The name of the new directory
        :return: The newly created directory
        :rtype: :class:`BaseFileResource`
        :raises HTTPError: If an error occurs.

            - 400 If error occurred preventing the directory creation. For
                example, if a directory with the same name already exists at ``dir_path``.
            - 403 If the user represented by the passed ``agave_client`` does not have
                WRITE permission on ``dir_path``.
            - 404 If the ``dir_path`` does not exist.
        """
        body = {
            'action': 'mkdir',
            'path': dir_name
        }
        result = self._agave.files.manage(systemId=self.system,
                                          filePath=urllib.parse.quote(self.path),
                                          body=body)
        return BaseFileResource.listing(system=result['systemId'], path=result['path'],
                                        agave_client=self._agave)

    def move(self, dest_path, file_name=None):
        """
        Moves the current file to the provided destination path. If file_name is provided,
        the moved file will be renamed to that. If file_name is not provided then the file
        will be moved with the same name (default).
        :param str dest_path: The full path to the destination directory. This path must
            exist on the same system as the original file.
        :param str file_name: (optional) The name for the moved file. Defaults to the same
            name as the original file.
        :return: The newly moved file.
        :rtype: :class:`BaseFileResource`

        """
        if file_name is None:
            file_name = self.name
        body = {'action': 'move', 'path': '/'.join([dest_path, file_name])}
        move_result = self._agave.files.manage(systemId=self.system,
                                               filePath=urllib.parse.quote(self.path),
                                               body=body)
        return BaseFileResource.listing(self._agave, self.system, move_result['path'])

    def rename(self, new_name):
        """
        Convenience method for renaming a file. Delegates to BaseAgaveFile.move.

        :param new_name:
        :return: The renamed file
        :rtype: :class:`BaseFileResource`
        """
        return self.move(os.path.dirname(self.path), new_name)

    def share(self, username, permission, recursive=False):
        """
        Updates the permissions on this file for the provided username.

        :param str username: The username of the user to update share permissions for
        :param str permission: The new permission to set. This should be one of the
            permissions constants, e.g., READ, WRITE, EXECUTE, ALL, etc. See
            :class:`BaseAgaveFilePermission` for details.
        :param bool recursive: If this permission should be set recursively
        :return: self for chaining
        :rtype: :class:`BaseFileResource`
        """
        permission_body = {'username': username,
                           'permission': permission,
                           'recursive': recursive}
        logger.info('Updating file permissions on {}: {}'.format(self.agave_uri,
                                                                 permission_body))
        self._agave.files.updatePermissions(
            systemId=self.system,
            filePath=urllib.parse.quote(self.path),
            body=permission_body)
        return self

    def unshare(self, username):
        """
        Sets share permissions on this file for the provided username to NONE. This is a
        shortcut for ``BaseAgaveFile.share('username', 'NONE')``.

        :param str username: The username of the user to remove permissions for
        :return: self for chaining
        :rtype: :class:`BaseFileResource`
        """
        self._agave.files.updatePermissions(
            systemId=self.system,
            filePath=urllib.parse.quote(self.path),
            body={'username': username, 'permission': BaseFilePermissionResource.NONE})
        return self

    def unshare_all(self):
        """
        Removes all share permissions on this for except for those of the owner.

        :return: self for chaining
        :rtype: :class:`BaseFileResource`
        """
        self._agave.files.deletePermissions(systemId=self.system,
                                            filePath=urllib.parse.quote(self.path))
        return self

    def upload(self, upload_file):
        """
        Upload a file to this directory

        :param upload_file:
        :return:
        """
        return self._agave.files.importData(systemId=self.system,
                                            filePath=urllib.parse.quote(self.path),
                                            fileToUpload=upload_file)


class BaseAgaveFileHistoryRecord(BaseAgaveResource):

    def __init__(self, agave_client, **kwargs):
        super(BaseAgaveFileHistoryRecord, self).__init__(agave_client)
        self.status = None
        self.description = None
        self.createdBy = None
        self.created = None
        self.from_result(**kwargs)

    def from_result(self, **kwargs):
        self.status = kwargs.get('status')
        self.description = kwargs.get('description')
        self.createdBy = kwargs.get('createdBy')
        self.created = kwargs.get('created')

    def __str__(self):
        return '{} - {} - {}: {}'.format(self.created.strftime('%Y-%m-%dT%H:%M:%S%z'),
                                         self.status,
                                         self.createdBy,
                                         self.description)

    def __repr__(self):
        return '<BaseAgaveFileHistoryRecord: {}>'.format(str(self))


class BaseFilePermissionResource(BaseAgaveResource):

    READ = 'READ'
    READ_WRITE = 'READ_WRITE'
    READ_EXECUTE = 'READ_EXECUTE'
    WRITE = 'WRITE'
    WRITE_EXECUTE = 'WRITE_EXECUTE'
    EXECUTE = 'EXECUTE'
    ALL = 'ALL'
    NONE = 'NONE'

    def __init__(self, agave_client, agave_file, **kwargs):
        """
        :param agavepy.agave.Agave agave_client:
        :param BaseFileResource agave_file:
        :param kwargs:
        """
        defaults = {
            'permission': {},
            'recursive': False,
            'username': None
        }
        defaults.update(**kwargs)
        super(BaseFilePermissionResource, self).__init__(agave_client, **defaults)

        self.agave_file = agave_file

    @property
    def read(self):
        return self.permission.get('read', False)

    @read.setter
    def read(self, value):
        self.permission['read'] = value

    @property
    def write(self):
        return self.permission.get('write', False)

    @write.setter
    def write(self, value):
        self.permission['write'] = value

    @property
    def execute(self):
        return self.permission.get('execute', False)

    @execute.setter
    def execute(self, value):
        self.permission['execute'] = value

    @property
    def permission_bit(self):
        if self.read:
            if self.write:
                if self.execute:
                    return BaseFilePermissionResource.ALL
                return BaseFilePermissionResource.READ_WRITE
            elif self.execute:
                return BaseFilePermissionResource.READ_EXECUTE
            return BaseFilePermissionResource.READ
        elif self.write:
            if self.execute:
                return BaseFilePermissionResource.WRITE_EXECUTE
            return BaseFilePermissionResource.WRITE
        elif self.execute:
            return BaseFilePermissionResource.EXECUTE
        return BaseFilePermissionResource.NONE

    @permission_bit.setter
    def permission_bit(self, value):
        if value == BaseFilePermissionResource.READ:
            self.read = True
            self.write = False
            self.execute = False
        elif value == BaseFilePermissionResource.READ_WRITE:
            self.read = True
            self.write = True
            self.execute = False
        elif value == BaseFilePermissionResource.READ_EXECUTE:
            self.read = True
            self.write = False
            self.execute = True
        elif value == BaseFilePermissionResource.WRITE:
            self.read = False
            self.write = True
            self.execute = False
        elif value == BaseFilePermissionResource.WRITE_EXECUTE:
            self.read = False
            self.write = True
            self.execute = True
        elif value == BaseFilePermissionResource.EXECUTE:
            self.read = False
            self.write = False
            self.execute = True
        elif value == BaseFilePermissionResource.ALL:
            self.read = True
            self.write = True
            self.execute = True
        elif value == BaseFilePermissionResource.NONE:
            self.read = False
            self.write = False
            self.execute = False

    @property
    def request_body(self):
        return json.dumps({
            'username': self.username,
            'recursive': self.recursive,
            'permission': self.permission_bit
        })

    def save(self):
        """
        Persist this permission

        :return: self
        :rtype: :class:`BaseFilePermissionResource`
        """
        self._agave.files.updatePermissions(
            systemId=self.agave_file.system,
            filePath=self.agave_file.path,
            body=self.request_body)
        logger.info('Setting permissions: %s', self.request_body)
        return self

    def delete(self):
        """
        Delete this permission. Convenience method for setting read/write/execute to
        False, then calling BaseAgaveFilePermission.save().

        :return: None
        """
        self.permission_bit = BaseFilePermissionResource.NONE
        self.save()

    @classmethod
    def list_permissions(cls, agave_client, agave_file, username=None):
        """
        Get the permissions for a BaseAgaveFile object. Optionally restrict results to
        only the provided username.

        :param agavepy.agave.Agave agave_client: API client instance.
        :param BaseFileResource agave_file: the File for which to list permissions.
        :param str username: A user to restrict the permissions listing results.

        :return: List of permissions for the passed File.
        :rtype: list of BaseFilePermissionResource
        """
        try:
            records = agave_client.files.listPermissions(systemId=agave_file.system,
                                                         filePath=agave_file.path)
        except HTTPError as error:
            if error.response.status_code != 404:
                raise

            return []

        if username is not None:
            records = [r for r in records if r['username'] == username]

        return [cls(agave_client, agave_file, **r) for r in records]

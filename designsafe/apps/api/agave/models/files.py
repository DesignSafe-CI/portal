import json
import os
from datetime import datetime
from . import BaseAgaveResource


class BaseAgaveFile(BaseAgaveResource):
    """

    """

    def __init__(self, agave_client, **kwargs):
        super(BaseAgaveFile, self).__init__(agave_client)
        self.name = None
        self.path = None
        self.lastModified = None
        self.length = 0
        self.permissions = None
        self.format = None
        self.mimeType = None
        self.type = None
        self.system = None
        self._links = {}
        self.from_result(**kwargs)

    def from_result(self, **kwargs):
        self.name = kwargs.get('name')
        self.path = kwargs.get('path')
        self.lastModified = kwargs.get('lastModified')
        self.length = kwargs.get('length', 0)
        self.permissions = kwargs.get('permissions')
        self.format = kwargs.get('format')
        self.mimeType = kwargs.get('mimeType')
        self.type = kwargs.get('type')
        self.system = kwargs.get('system')
        self._links = kwargs.get('_links', {})

    def __str__(self):
        return self.id

    def __repr__(self):
        return '<BaseAgaveFile: {}>'.format(self._links['self']['href'])

    @classmethod
    def from_path(cls, agave_client, system, file_path):
        list_result = agave_client.files.list(systemId=system, filePath=file_path)
        file_result = list_result[0]
        if file_result['type'] == 'dir':
            # directory names display as "." from API
            file_result['name'] = os.path.basename(file_result['path'])
        return cls(agave_client=agave_client, **file_result)

    def copy(self, destination, new_name=None):
        """
        Copies the current file to the provided destination path. If new_name is provided
        the copied file will be renamed as that. If new_name is not provided then the file
        will be copied with the same name.
        :param str destination: The full path to the destination directory. This path must
            exist on the same system as the original file.
        :param str new_name: The name for the newly copied file. Defaults to the same name
            as the original file.
        :return: The newly copied file.
        :rtype: BaseAgaveFile
        """
        if new_name is None:
            new_name = self.name
        body = {'action': 'copy', 'path': '/'.join([destination, new_name])}
        copy_result = self._agave.files.manage(systemId=self.system, filePath=self.path,
                                               body=body)
        return BaseAgaveFile.from_path(self._agave, self.system, copy_result['path'])

    def delete(self):
        """
        Removes this file from the remote system.
        :return:
        """
        self._agave.files.delete(systemId=self.system, filePath=self.path)

    def history(self):
        history = self._agave.files.getHistory(systemId=self.system, filePath=self.path)
        return [BaseAgaveFileHistoryRecord(self._agave, **h) for h in history]

    @property
    def id(self):
        return '/'.join([self.system, self.path])

    def list_permissions(self, username=None):
        """
        List permissions for this File. If username is provided, returns only permissions
        for that user, otherwise returns all permissions.
        :param str username: A user to restrict the permissions listing results.
        :return: A list of BaseAgaveFilePermission
        :rtype: list[BaseAgaveFilePermission]
        """
        return BaseAgaveFilePermission.list_permissions(self._agave, self, username)

    def move(self):
        pass

    def rename(self):
        pass
    
    def share(self):
        pass

    @property
    def trail(self):
        path_comps = self.path.split('/')
        if path_comps[-1] == '':
            path_comps.pop()  # if path had a trailing slash, skip it

        trail_comps = [{'name': path_comps[-i],
                        'trail': '/'.join(path_comps[:-i]) or '/',
                        } for i in range(1, len(path_comps))][::-1]
        trail_comps.insert(0, {
            'name': '',
            'path': '/',
        })
        return trail_comps


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


class BaseAgaveFilePermission(BaseAgaveResource):

    def __init__(self, agave_client, agave_file, **kwargs):
        """

        :param agavepy.agave.Agave agave_client:
        :param BaseAgaveFile agave_file:
        :param kwargs:
        """
        super(BaseAgaveFilePermission, self).__init__(agave_client)
        self.agave_file = agave_file
        self.username = None
        self._pems = {}
        self.from_result(**kwargs)

    def from_result(self, **kwargs):
        self.username = kwargs.get('username')
        self._pems = kwargs.get('permission', {})

    @property
    def read(self):
        return self._pems.get('read', False)

    @read.setter
    def read(self, value):
        self._pems['read'] = value

    @property
    def write(self):
        return self._pems.get('write', False)

    @write.setter
    def write(self, value):
        self._pems['write'] = value

    @property
    def execute(self):
        return self._pems.get('execute', False)

    @execute.setter
    def execute(self, value):
        self._pems['execute'] = value

    @property
    def permission_bit(self):
        if self.read:
            if self.write:
                if self.execute:
                    return 'ALL'
                return 'READ_WRITE'
            elif self.execute:
                return 'READ_EXECUTE'
            return 'READ'
        elif self.write:
            if self.execute:
                return 'WRITE_EXECUTE'
            return 'WRITE'
        elif self.execute:
            return 'EXECUTE'
        return 'NONE'

    @permission_bit.setter
    def permission_bit(self, value):
        if value == 'READ':
            self.read = True
            self.write = False
            self.execute = False
        elif value == 'READ_WRITE':
            self.read = True
            self.write = True
            self.execute = False
        elif value == 'READ_EXECUTE':
            self.read = True
            self.write = False
            self.execute = True
        elif value == 'WRITE':
            self.read = False
            self.write = True
            self.execute = False
        elif value == 'WRITE_EXECUTE':
            self.read = False
            self.write = True
            self.execute = True
        elif value == 'EXECUTE':
            self.read = False
            self.write = False
            self.execute = True
        elif value == 'ALL':
            self.read = True
            self.write = True
            self.execute = True
        elif value == 'NONE':
            self.read = False
            self.write = False
            self.execute = False

    @property
    def request_body(self):
        return json.dumps({
            "username": self.username,
            "permission": self.permission_bit
        })

    def save(self):
        """
        Persist this permission

        :return: self
        :rtype: :class:`BaseAgaveFilePermission`
        """
        result = self._agave.files.updatePermissions(
            systemId=self.agave_file.system,
            filePath=self.agave_file.path,
            body=self.request_body)
        self.from_result(**result)
        return self

    def delete(self):
        """
        Delete this permission. Convenience method for setting read/write/execute to
        False, then calling BaseAgaveFilePermission.save().

        :return: None
        """
        self.permission_bit = 'NONE'
        self.save()

    @classmethod
    def list_permissions(cls, agave_client, agave_file, username=None):
        """
        Get the permissions for a BaseAgaveFile object. Optionally restrict results to
        only the provided username.

        :param agavepy.agave.Agave agave_client: API client instance.
        :param BaseAgaveFile agave_file: the File for which to list permissions.
        :param str username: A user to restrict the permissions listing results.

        :return: List of permissions for the passed File.
        :rtype: list of BaseAgaveFilePermission
        """
        records = agave_client.files.listPermissions(systemId=agave_file.system,
                                                     filePath=agave_file.path)
        if username is not None:
            records = [r for r in records if r['username'] == username]

        return [cls(agave_client, agave_file, **r) for r in records]

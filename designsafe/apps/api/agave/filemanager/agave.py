import os
from designsafe.apps.api.agave.models.files import (BaseFileResource,
                                                    BaseFilePermissionResource,
                                                    BaseAgaveFileHistoryRecord)
from .base import BaseFileManager


class AgaveFileManager(BaseFileManager):

    DEFAULT_SYSTEM_ID = 'designsafe.storage.default'

    NAME = 'agave'

    def __init__(self, agave_client):
        self._ag = agave_client

    def copy(self, system, file_path, dest_path=None, dest_name=None):
        f = BaseFileResource.listing(self._ag, system, file_path)

        # default to same path
        if dest_path is None:
            dest_path = f.path

        # default to same name
        if dest_name is None:
            dest_name = f.name

        # if same path and name, add suffix to file name
        if dest_name == f.name and dest_path == f.path:
            dest_name = '{0}_copy{1}'.format(*os.path.splitext(dest_name))

        copied_file = f.copy(dest_path, dest_name)

        # schedule celery task to index new copy

        return copied_file

    def delete(self, system, path):
        return BaseFileResource(self._ag, system, path).delete()

    def download(self, system, path):
        return BaseFileResource.listing(self._ag, system, path).download_postit()

    def import_url(self):
        pass

    def index(self):
        pass

    def listing(self, system, file_path):
        return BaseFileResource.listing(self._ag, system, file_path)

    def mkdir(self, system, file_path, dir_name):
        f = BaseFileResource(self._ag, system, file_path)
        return f.mkdir(dir_name)

    def move(self, system, file_path, dest_path, dest_name=None):
        f = BaseFileResource.listing(self._ag, system, file_path)
        return f.move(dest_path, dest_name)

    def rename(self, system, file_path, rename_to):
        f = BaseFileResource.listing(self._ag, system, file_path)
        return f.rename(rename_to)

    def share(self, system, file_path, username, permission):
        f = BaseFileResource(self._ag, system, file_path)
        pem = BaseFilePermissionResource(self._ag, f)
        pem.username = username
        pem.permission_bit = permission
        return pem.save()

    def list_permissions(self, system, file_path):
        f = BaseFileResource(self._ag, system, file_path)
        return BaseFilePermissionResource.list_permissions(self._ag, f)

    def trash(self, system, file_path):
        f = BaseFileResource(self._ag, system, file_path)
        pass

    def upload(self):
        pass

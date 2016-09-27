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
        f = BaseFileResource(self._ag, system, file_path)

        # default to same path
        if dest_path is None:
            dest_path = f.path

        # default to same name
        if dest_name is None:
            dest_name = f.name

        # if same path and name, add suffix to file name
        if dest_name == f.name and dest_path == f.path:
            dest_name = '{0}_copy{1}'.format(*os.path.splitext(dest_name))

        return f.copy(dest_path, dest_name)

    def delete(self, system, path):
        BaseFileResource(self._ag, system, path).delete()

    def download(self):
        pass

    def import_url(self):
        pass

    def index(self):
        pass

    def listing(self, system, file_path):
        return BaseFileResource.listing(self._ag, system, file_path)

    def mkdir(self, system, file_path, dir_name):
        f = BaseFileResource(self._ag, system, file_path)
        f.mkdir(dir_name)
        pass

    def move(self, system, file_path, dest_path):
        pass

    def share(self):
        pass

    def trash(self):
        pass

    def upload(self):
        pass

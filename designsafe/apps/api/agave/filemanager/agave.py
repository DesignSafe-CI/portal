import os
from datetime import datetime
from designsafe.apps.api.agave.filemanager.base import BaseFileManager
from designsafe.apps.api.agave.models.files import (BaseFileResource,
                                                    BaseFilePermissionResource,
                                                    BaseAgaveFileHistoryRecord)
from requests import HTTPError


class AgaveFileManager(BaseFileManager):
    """
    TODO !!

    trigger celery indexing tasks on CRUD operations
    """

    DEFAULT_SYSTEM_ID = 'designsafe.storage.default'

    NAME = 'agave'

    def __init__(self, agave_client):
        self._ag = agave_client

    def import_data(self, system, file_path, from_system, from_file_path):
        file_path = file_path or '/'
        if file_path != '/':
            file_path.strip('/')
        from_file_path = from_file_path.strip('/')
        f = BaseFileResource.listing(self._ag, system, file_path)
        res = f.import_data(from_system, from_file_path)# 
        return res

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

    # def import_url(self):
    #     pass
    #
    # def index(self):
    #     pass

    def listing(self, system, file_path):
        return BaseFileResource.listing(self._ag, system, file_path)

    def list_permissions(self, system, file_path):
        f = BaseFileResource(self._ag, system, file_path)
        return BaseFilePermissionResource.list_permissions(self._ag, f)

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

    def trash(self, system, file_path, trash_path):

        name = os.path.basename(file_path)
        f = BaseFileResource(self._ag, system, file_path)

        # first ensure trash_path exists
        BaseFileResource.ensure_path(self._ag, system, trash_path)

        # check if file with same name exists in trash; expect 404
        try:
            check = os.path.join(trash_path, name)
            BaseFileResource.listing(self._ag, system, check)

            # if we did not 404, then we have a conflict; append date to name
            name_ext = os.path.splitext(name)
            timestamp = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')
            name = '{0} {1}{2}'.format(name_ext[0], timestamp, name_ext[1])
        except HTTPError as e:
            if e.response.status_code != 404:
                raise

        return f.move(trash_path, name)

    def upload(self, system, file_path, upload_file):
        f = BaseFileResource(self._ag, system, file_path)
        return f.upload(upload_file)

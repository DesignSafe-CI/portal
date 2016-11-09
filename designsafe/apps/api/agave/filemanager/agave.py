import re
import os
from datetime import datetime
from designsafe.apps.api.agave.filemanager.base import BaseFileManager
from designsafe.apps.api.agave.models.files import (BaseFileResource,
                                                    BaseFilePermissionResource,
                                                    BaseAgaveFileHistoryRecord)
from designsafe.apps.api.tasks import reindex_agave
from requests import HTTPError


class AgaveFileManager(BaseFileManager):
    """
    TODO !!

    trigger celery indexing tasks on CRUD operations
    """

    DEFAULT_SYSTEM_ID = 'designsafe.storage.default'

    NAME = 'agave'

    SYSTEM_ID_PATHS = [
        {'regex': r'^designsafe.storage.default$',
         'path': '/corral-repl/tacc/NHERI/shared'},
        {'regex': r'^project\-',
         'path': '/corral-repl/tacc/NHERI/projects'}
    ]

    def __init__(self, agave_client):
        self._ag = agave_client

    def base_mounted_path(self, string):
        path = None
        for mapping in self.SYSTEM_ID_PATHS:
            if re.search(mapping['regex'], string):
                path = mapping['path']
                break

        return path

    def import_data(self, system, file_path, from_system, from_file_path):
        file_path = file_path or '/'
        if file_path != '/':
            file_path.strip('/')
        from_file_path = from_file_path.strip('/')
        f = BaseFileResource.listing(self._ag, system, file_path)
        res = f.import_data(from_system, from_file_path)# 
        reindex_agave.apply_async(kwargs = {'username': 'ds_admin',
                                            'file_id': '{}/{}'.format(system, file_path)})
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
        reindex_agave.apply_async(kwargs = {'username': 'ds_admin',
                                            'file_id': '{}/{}'.format(system, file_path)})

        return copied_file

    def delete(self, system, path):
        resp = BaseFileResource(self._ag, system, path).delete()
        reindex_agave.apply_async(kwargs = {'username': 'ds_admin',
                                            'file_id': '{}/{}'.format(system, path)})
        return resp

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
        resp = f.mkdir(dir_name)
        reindex_agave.apply_async(kwargs = {'username': 'ds_admin',
                                            'file_id': '{}/{}'.format(system, file_path)})
        return resp

    def move(self, system, file_path, dest_path, dest_name=None):
        f = BaseFileResource.listing(self._ag, system, file_path)
        resp = f.move(dest_path, dest_name)
        parent_path = '/'.join(file_path.strip('/').split('/')[:-1])
        reindex_agave.apply_async(kwargs = {'username': 'ds_admin',
                                            'file_id': '{}/{}'.format(system, parent_path),
                                            'levels': 1})

        reindex_agave.apply_async(kwargs = {'username': 'ds_admin',
                                            'file_id': '{}/{}'.format(system, os.path.join(dest_path, dest_name))})
        return resp

    def rename(self, system, file_path, rename_to):
        f = BaseFileResource.listing(self._ag, system, file_path)
        resp = f.rename(rename_to)
        parent_path = '/'.join(file_path.strip('/').split('/')[:-1])
        reindex_agave.apply_async(kwargs = {'username': 'ds_admin',
                                            'file_id': '{}/{}'.format(system, parent_path)})
        return resp

    def share(self, system, file_path, username, permission):
        f = BaseFileResource(self._ag, system, file_path)
        pem = BaseFilePermissionResource(self._ag, f)
        pem.username = username
        pem.permission_bit = permission
        resp = pem.save()
        reindex_agave.apply_async(kwargs = {'username': 'ds_admin',
                                            'file_id': '{}/{}'.format(system, file_path)})
        return resp

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

        parent_path = '/'.join(file_path.strip('/').split('/')[:-1])
        reindex_agave.apply_async(kwargs = {'username': 'ds_admin',
                                            'file_id': '{}/{}'.format(system, parent_path),
                                            'levels': 1})
        resp = f.move(trash_path, name)
        reindex_agave.apply_async(kwargs = {'username': 'ds_admin',
                                            'file_id': '{}/{}'.format(system, os.path.join(trash_path, name))})
        return resp

    def upload(self, system, file_path, upload_file):
        f = BaseFileResource(self._ag, system, file_path)
        resp = f.upload(upload_file)
        reindex_agave.apply_async(kwargs = {'username': 'ds_admin',
                                            'file_id': '{}/{}'.format(system, file_path)})
        return resp

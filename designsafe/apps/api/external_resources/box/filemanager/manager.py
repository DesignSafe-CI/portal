""" Box filemanager"""
import os
import re
import sys
import logging
from designsafe.apps.data.tasks import reindex_agave
from designsafe.apps.api.exceptions import ApiException
from designsafe.apps.api.external_resources.box.models.files import BoxFile
from designsafe.apps.api.notifications.models import Notification
from designsafe.apps.box_integration.models import BoxUserToken
from boxsdk.exception import BoxException, BoxOAuthException
from django.contrib.auth import get_user_model
from django.core.urlresolvers import reverse
from django.http import (JsonResponse, HttpResponseBadRequest)
from requests import HTTPError

# pylint: disable=invalid-name
logger = logging.getLogger(__name__)


class FileManager(object):

    NAME = 'box'

    def __init__(self, user_obj, **kwargs):
        self._user = user_obj

        if user_obj.is_anonymous():
            raise ApiException(status=403, message='Log in required to access Box files.')

        try:
            self.box_api = user_obj.box_user_token.client
        except BoxUserToken.DoesNotExist:
            message = 'Connect your Box account <a href="'+ reverse('box_integration:index') + '">here</a>'
            raise ApiException(status=400, message=message, extra={
                'action_url': reverse('box_integration:index'),
                'action_label': 'Connect Box.com Account'
            })

    def parse_file_id(self, file_id):
        if file_id is not None:
            file_id = file_id.strip('/')
            try:
                file_type, file_id = BoxFile.parse_file_id(file_id)
            except AssertionError:
                # file path is hierarchical; need to find the BoxObject here
                box_object = self.box_object_for_file_hierarchy_path(file_id)
                file_type = box_object._item_type
                file_id = box_object.object_id
        else:
            file_type, file_id = u'folder', u'0'

        return file_type, file_id

    def box_object_for_file_hierarchy_path(self, file_path):
        """
        Resolves a hierarchical path to a box_object. For example, given the file_path
        "Documents/Project/Testing" this function will iteratively query Box, starting at
        All Files (folder/0), and looking for a child with the name of the next element in
        the path. If found, the BoxObject is returned. Otherwise, raises.

        Args:
            file_path: The hierarchical path to the BoxObject

        Returns:
            The BoxObject

        """
        box_object = self.box_api.folder(u'0')
        if file_path is None or file_path == '' or file_path == 'All Files':
            return box_object
        path_c = file_path.split('/')
        for c in path_c:

            if box_object._item_type != 'folder':
                # we've found a file, but there are still more path components to process
                raise ApiException('The Box path "{0}" does not exist.'.format(file_path),
                                   status=404)

            limit = 100
            offset = 0
            next_object = None
            while next_object is None:
                children = self.box_api.folder(box_object.object_id).get_items(
                    limit=limit, offset=offset)
                for child in children:
                    if child.name == c:
                        next_object = child
                        break
                if len(children) == limit:
                    offset += limit
                elif next_object is None:  # this can happen if path doesn't exist
                    raise ApiException(
                        'The Box path "{0}" does not exist.'.format(file_path),
                        status=404)
            box_object = next_object
        return box_object

    def listing(self, file_id=None, **kwargs):
        """
        Lists contents of a folder or details of a file.

        Args:
            file_id: The type/id of the Box Object. This should be formatted {type}/{id}
            where {type} is one of ['folder', 'file'] and {id} is the numeric Box ID for
            the object.

        Returns:
            Dictionary with two keys;
              - resource: File System resource that we're listing
              - files: Array of Api file-like objects
        """

        default_pems = 'ALL'

        try:
            file_type, file_id = self.parse_file_id(file_id)

            box_op = getattr(self.box_api, file_type)
            box_item = box_op(file_id).get()
            if file_type == 'folder':
                limit = int(kwargs.pop('limit', 100))
                offset = int(kwargs.pop('offset', 0))
                limit = offset + limit

                children = [BoxFile(item, parent=box_item).to_dict(default_pems=default_pems)
                            for item in box_item.get_items(limit, offset=offset)]
            else:
                children = None

            list_data = BoxFile(box_item).to_dict(default_pems=default_pems)
            if children:
                list_data['children'] = children

            return list_data

        except AssertionError:
            raise ApiException(status=404,
                               message='The file you requested does not exist.')
        except BoxOAuthException:
            # user needs to reconnect with Box
            message = 'While you previously granted this application access to Box, ' \
                      'that grant appears to be no longer valid. Please ' \
                      '<a href="%s">disconnect and reconnect your Box.com account</a> ' \
                      'to continue using Box data.' % reverse('box_integration:index')
            raise ApiException(status=403, message=message)
        except BoxException as e:
            message = 'Unable to communicate with Box: %s' % e.message
            raise ApiException(status=500, message=message)

    def file(self, file_id, action, path=None, **kwargs):
        pass

    def is_shared(self, *args, **kwargs):
        return False

    def is_search(self, *args, **kwargs):
        return False

    def copy(self, username, src_file_id, dest_file_id, **kwargs):
        try:
            n = Notification(event_type='data',
                             status=Notification.INFO,
                             operation='box_download_start',
                             message='Starting download file %s from box.' % (src_file_id,),
                             user=username,
                             extra={})
            n.save()
            logger.debug('username: {}, src_file_id: {}, dest_file_id: {}'.format(username, src_file_id, dest_file_id))
            user = get_user_model().objects.get(username=username)

            from designsafe.apps.api.agave.filemanager.agave import AgaveFileManager
            # Initialize agave filemanager
            agave_fm = AgaveFileManager(agave_client=user.agave_oauth.client)
            # Split destination file path
            dest_file_path_comps = dest_file_id.strip('/').split('/')
            # If it is an agave file id then the first component is a system id
            agave_system_id = dest_file_path_comps[0]
            # Start construction the actual real path into the NSF mount
            if dest_file_path_comps[1:]:
                dest_real_path = os.path.join(*dest_file_path_comps[1:])
            else:
                dest_real_path = '/'
            # Get what the system id maps to
            base_mounted_path = agave_fm.base_mounted_path(agave_system_id)
            # Add actual path
            if re.search(r'^project-', agave_system_id):
                project_dir = agave_system_id.replace('project-', '', 1)
                dest_real_path = os.path.join(base_mounted_path, project_dir, dest_real_path.strip('/'))
            else:
                dest_real_path = os.path.join(base_mounted_path, dest_real_path.strip('/'))
            logger.debug('dest_real_path: {}'.format(dest_real_path))

            # box_fm = BoxFileManager(user)
            box_file_type, box_file_id = self.parse_file_id(file_id=src_file_id)

            levels = 0
            downloaded_file_path = None
            if box_file_type == 'file':
                downloaded_file_path = self.download_file(box_file_id, dest_real_path)
                levels = 1
            elif box_file_type == 'folder':
                downloaded_file_path = self.download_folder(box_file_id, dest_real_path)

            n = Notification(event_type='data',
                             status=Notification.SUCCESS,
                             operation='box_download_end',
                             message='File %s has been copied from box successfully!' % (src_file_id, ),
                             user=username,
                             extra={})
            n.save()
            if re.search(r'^project-', agave_system_id):
                project_dir = agave_system_id.replace('project-', '', 1)
                project_dir = os.path.join(base_mounted_path.strip('/'), project_dir)
                agave_file_path = downloaded_file_path.replace(project_dir, '', 1).strip('/')
            else:
                agave_file_path = downloaded_file_path.replace(base_mounted_path, '', 1).strip('/')

            reindex_agave.apply_async(kwargs={
                                      'username': user.username,
                                      'file_id': '{}/{}'.format(agave_system_id, agave_file_path)
                                      },
                                      queue='indexing')
        except:
            logger.exception('Unexpected task failure: box_download', extra={
                'username': username,
                'box_file_id': src_file_id,
                'dest_file_id': dest_file_id
            })
            n = Notification(event_type='data',
                             status=Notification.ERROR,
                             operation='box_download_error',
                             message='We were unable to get the specified file from box. '
                                     'Please try again...',
                             user=username,
                             extra={})
            n.save()
            raise

    def move(self, file_id, **kwargs):
        raise ApiException('Moving Box files is not supported.', status=400,
                           extra={'file_id': file_id,
                                  'kwargs': kwargs})

    def get_preview_url(self, file_id, **kwargs):
        file_type, file_id = self.parse_file_id(file_id)
        if file_type == 'file':
            embed_url = self.box_api.file(file_id).get(fields=['expiring_embed_link'])
            return {'href': embed_url._response_object['expiring_embed_link']['url']}
        return None

    def preview(self, file_id, file_mgr_name, **kwargs):
        # try:
        box_file_type, box_file_id = self.parse_file_id(file_id)
        box_op = getattr(self.box_api, box_file_type)
        box_file = BoxFile(box_op(box_file_id).get())
        if box_file.previewable:
            preview_url = reverse('designsafe_api:box_files_media',
                                  args=[file_mgr_name, file_id.strip('/')])
            return JsonResponse({'href':
                                   '{}?preview=true'.format(preview_url)})
        else:
            return HttpResponseBadRequest('Preview not available for this item.')
        # except HTTPError as e:
                # logger.exception('Unable to preview file')
                # return HttpResponseBadRequest(e.response.text)

    def get_download_url(self, file_id, **kwargs):
        file_type, file_id = self.parse_file_id(file_id)
        if file_type == 'file':
            download_url = self.box_api.file(file_id).get_shared_link_download_url()
            return {'href': download_url}
        return None

    #def import_file(self, file_id, from_resource, import_file_id, **kwargs):
    #    box_upload.apply_async(args=(self._user.username,
    #                                 file_id,
    #                                 from_resource,
    #                                 import_file_id),
    #                           countdown=10)

    #    return {'message': 'Your file(s) have been scheduled for upload to box.'}

    def download_file(self, box_file_id, download_directory_path):
        """
        Downloads the file for box_file_id to the given download_path.

        :param box_file_manager:
        :param box_file_id:
        :param download_directory_path:
        :return: the full path to the downloaded file
        """
        box_file = self.box_api.file(box_file_id).get()
        # convert utf-8 chars
        safe_filename = box_file.name.encode(sys.getfilesystemencoding(), 'ignore')
        file_download_path = os.path.join(download_directory_path, safe_filename)
        logger.debug('Download file %s <= box://file/%s', file_download_path, box_file_id)

        with open(file_download_path, 'wb') as download_file:
            box_file.download_to(download_file)

        return file_download_path

    def download_folder(self, box_folder_id, download_path):
        """
        Recursively the folder for box_folder_id, and all of its contents, to the given
        download_path.

        :param box_file_manager:
        :param box_folder_id:
        :param download_path:
        :return:
        """
        box_folder = self.box_api.folder(box_folder_id).get()
        # convert utf-8 chars
        safe_dirname = box_folder.name.encode(sys.getfilesystemencoding(), 'ignore')
        directory_path = os.path.join(download_path, safe_dirname)
        logger.debug('Creating directory %s <= box://folder/%s', directory_path, box_folder_id)
        try:
            os.mkdir(directory_path, 0o0755)
        except OSError as e:
            if e.errno == 17:  # directory already exists?
                pass
            else:
                logger.exception('Error creating directory: %s', directory_path)
                raise

        limit = 100
        offset = 0
        while True:
            items = box_folder.get_items(limit, offset)
            for item in items:
                if item.type == 'file':
                    self.download_file(item.object_id, directory_path)
                elif item.type == 'folder':
                    self.download_folder(item.object_id, directory_path)
            if len(items) == limit:
                offset += limit
            else:
                break

        return directory_path

    def upload(self, username, src_file_id, dest_file_id):
        try:
            n = Notification(event_type='data',
                             status=Notification.INFO,
                             operation='box_upload_start',
                             message='Starting uploading file %s to box.' % (src_file_id,),
                             user=username,
                             extra={})
            n.save()
            user = get_user_model().objects.get(username=username)

            from designsafe.apps.api.agave.filemanager.agave import AgaveFileManager
            # Initialize agave filemanager
            agave_fm = AgaveFileManager(agave_client=user.agave_oauth.client)
            # Split src ination file path
            src_file_path_comps = src_file_id.strip('/').split('/')
            # If it is an agave file id then the first component is a system id
            agave_system_id = src_file_path_comps[0]
            # Start construction the actual real path into the NSF mount
            if src_file_path_comps[1:]:
                src_real_path = os.path.join(*src_file_path_comps[1:])
            else:
                src_real_path = '/'
            # Get what the system id maps to
            base_mounted_path = agave_fm.base_mounted_path(agave_system_id)
            # Add actual path
            if re.search(r'^project-', agave_system_id):
                project_dir = agave_system_id.replace('project-', '', 1)
                src_real_path = os.path.join(base_mounted_path, project_dir, src_real_path.strip('/'))
            else:
                src_real_path = os.path.join(base_mounted_path, src_real_path.strip('/'))
            logger.debug('src_real_path: {}'.format(src_real_path))

            box_file_type, box_file_id = self.parse_file_id(file_id=dest_file_id.strip('/'))
            if os.path.isfile(src_real_path):
                self.upload_file(box_file_id, src_real_path)
            elif os.path.isdir(src_real_path):
                self.upload_directory(box_file_id, src_real_path)
            else:
                logger.error('Unable to upload %s: file does not exist!',
                             src_real_path)

            n = Notification(event_type='data',
                             status=Notification.SUCCESS,
                             operation='box_upload_end',
                             message='File %s has been copied to box successfully!' % (src_file_id, ),
                             user=username,
                             extra={})
            n.save()
        except Exception as err:
            logger.exception('Unexpected task failure: box_upload', extra={
                'username': username,
                'src_file_id': src_file_id,
                'dst_file_id': dest_file_id
            })
            n = Notification(event_type='data',
                             status=Notification.ERROR,
                             operation='box_upload_error',
                             message='We were unable to get the specified file from box. '
                                     'Please try again...',
                             user=username,
                             extra={})
            n.save()
            raise

    def upload_file(self, box_folder_id, file_real_path):
        file_path, file_name = os.path.split(file_real_path)
        with open(file_real_path, 'rb') as file_handle:
            box_folder = self.box_api.folder(box_folder_id)
            uploaded_file = box_folder.upload_stream(file_handle, file_name)
            logger.info('Successfully uploaded %s to box:folder/%s as box:file/%s',
                        file_real_path, box_folder_id, uploaded_file.object_id)


    def upload_directory(self, box_parent_folder_id, dir_real_path):
        """
        Recursively uploads the directory and all of its contents (subdirectories and files)
        to the box folder specified by box_parent_folder_id.

        :param box_parent_folder_id: The box folder to upload the directory to.
        :param dir_real_path: The real path on the filesystem of the directory to upload.
        :return: The new box folder.
        """

        dirparentpath, dirname = os.path.split(dir_real_path)
        box_parent_folder = self.box_api.folder(box_parent_folder_id)
        logger.info('Create directory %s in box folder/%s', dirname, box_parent_folder_id)
        box_folder = box_parent_folder.create_subfolder(dirname)

        for dirpath, subdirnames, filenames in os.walk(dir_real_path):
            # upload all the files
            for filename in filenames:
                filepath = os.path.join(dirpath, filename)
                self.upload_file(box_folder.object_id, filepath)

            # upload all the subdirectories
            for subdirname in subdirnames:
                subdirpath = os.path.join(dirpath, subdirname)
                self.upload_directory(box_folder.object_id, subdirpath)

            # prevent further walk, because recursion
            subdirnames[:] = []

        return box_folder


""" Dropbox filemanager"""
import os
import re
import sys
import logging
from designsafe.apps.api.exceptions import ApiException
from designsafe.apps.api.external_resources.dropbox.models.files import DropboxFile
from designsafe.apps.api.notifications.models import Notification
from designsafe.apps.api.tasks import reindex_agave
#from designsafe.apps.api.tasks import dropbox_upload
from designsafe.apps.dropbox_integration.models import DropboxUserToken
from dropbox.exceptions import ApiError, AuthError
from dropbox.files import ListFolderResult, FileMetadata, FolderMetadata, UploadSessionCursor, CommitInfo
from dropbox.dropbox import Dropbox
from dropbox.oauth import DropboxOAuth2Flow, BadRequestException, BadStateException, CsrfException, NotApprovedException, ProviderException

from django.contrib.auth import get_user_model
from django.core.urlresolvers import reverse
from django.http import (JsonResponse, HttpResponseBadRequest)

# pylint: disable=invalid-name
logger = logging.getLogger(__name__)


class FileManager(object):

    NAME = 'dropbox'

    def __init__(self, user_obj, **kwargs):
        self._user = user_obj

        if user_obj.is_anonymous():
            raise ApiException(status=403, message='Log in required to access Dropbox files.')

        try:
            # self.dropbox_api = user_obj.dropbox_user_token.client
            dropbox_token = DropboxUserToken.objects.get(user=user_obj)
            self.dropbox_api = Dropbox(dropbox_token.access_token)

        except DropboxUserToken.DoesNotExist:
            message = 'Connect your Dropbox account <a href="'+ reverse('dropbox_integration:index') + '">here</a>'
            raise ApiException(status=400, message=message, extra={
                'action_url': reverse('dropbox_integration:index'),
                'action_label': 'Connect Dropbox.com Account'
            })

    def parse_file_id(self, path):
        if path == '/' or path == '':
            file_type, path = u'folder', u''
        else:
            try:
                file_type, path = DropboxFile.parse_file_id(path)
            except AssertionError:
                # file path is hierarchical; need to find the DropboxObject here
                if path[:1] != '/':
                    path = '/' + path
                try:
                    dropbox_item = DropboxFile(self.dropbox_api.files_list_folder( path))
                    return dropbox_item.type, path
                except ApiError as e:
                    if e.error.get_path().is_not_found():
                        raise ApiException(
                            'The Dropbox path "{0}" does not exist.'.format(path),
                            status=404)

        return file_type, path

    def listing(self, file_id='', **kwargs):
        """
        Lists contents of a folder or details of a file.

        Args:
            file_id: The type/path of the Dropbox Object. This should be formatted {type}/{path}
            where {type} is one of ['folder', 'file'] and {path} is the numeric Dropbox path for
            the object.

        Returns:
            Dictionary with two keys;
              - resource: File System resource that we're listing
              - files: Array of Api file-like objects
        """

        default_pems = 'ALL'

        try:
            file_type, path = self.parse_file_id(file_id)
            dropbox_item = self.dropbox_api.files_list_folder(path)

            children = []

            if file_type =='folder':
                has_more = dropbox_item.has_more
                cursor = dropbox_item.cursor
                entries = dropbox_item.entries

                while True:
                    children.extend([DropboxFile(item, item.path_display.encode('utf-8'), parent=dropbox_item).to_dict(default_pems=default_pems)
                                for item in entries])
                    if has_more:
                        folder = self.dropbox_api.files_list_folder_continue(cursor)
                        entries = folder.entries
                        has_more = folder.has_more
                        cursor = folder.cursor
                    else:
                        break
            else:
                children = None

            list_data = DropboxFile(dropbox_item, path).to_dict(default_pems=default_pems)
            if children:
                list_data['children'] = children

            return list_data

        except AssertionError:
            raise ApiException(status=404,
                               message='The file/folder you requested does not exist.')
        except AuthError:
            # user needs to reconnect with Dropbox
            message = 'While you previously granted this application access to Dropbox, ' \
                      'that grant appears to be no longer valid. Please ' \
                      '<a href="%s">disconnect and reconnect your Dropbox.com account</a> ' \
                      'to continue using Dropbox data.' % reverse('dropbox_integration:index')
            raise ApiException(status=403, message=message)
        except ApiError as e:
            if e.error.get_path().is_not_folder():
                dropbox_item = self.dropbox_api.files_get_metadata(path)
                list_data = DropboxFile(dropbox_item, path)
                return list_data

            message = 'Unable to communicate with Dropbox: %s' % e.message
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
                             operation='dropbox_download_start',
                             message='Starting download file %s from dropbox.' % (src_file_id,),
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

            file_type, path = self.parse_file_id(src_file_id)

            levels = 0
            downloaded_file_path = None
            if file_type == 'file':
                downloaded_file_path = self.download_file(path, dest_real_path)
                levels = 1
            elif file_type == 'folder':
                downloaded_file_path = self.download_folder(path, dest_real_path)

            n = Notification(event_type='data',
                             status=Notification.SUCCESS,
                             operation='dropbox_download_end',
                             message='File %s has been copied from dropbox successfully!' % (src_file_id, ),
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
            logger.exception('Unexpected task failure: dropbox_download', extra={
                'username': username,
                'box_file_id': src_file_id,
                'dest_file_id': dest_file_id
            })
            n = Notification(event_type='data',
                             status=Notification.ERROR,
                             operation='box_download_error',
                             message='We were unable to get the specified file from dropbox. '
                                     'Please try again...',
                             user=username,
                             extra={})
            n.save()
            raise

    def move(self, file_id, **kwargs):
        raise ApiException('Moving Dropbox files is not supported.', status=400,
                           extra={'file_id': file_id,
                                  'kwargs': kwargs})

    def get_preview_url(self, file_id, **kwargs):
        file_type, path = self.parse_file_id(file_id)
        if file_type == 'file':
            shared_link = self.dropbox_api.sharing_create_shared_link(path).url
            embed_url = re.sub('dl=0$','raw=1', shared_link)

            return {'href': embed_url}
        return None

    def preview(self, file_id, file_mgr_name, **kwargs):
        try:
            file_type, path = self.parse_file_id(file_id)
            dropbox_item = self.dropbox_api.files_get_metadata(path)
            dropbox_file = DropboxFile(dropbox_item, path)
            if dropbox_file.previewable:
                preview_url = reverse('designsafe_api:box_files_media',
                                      args=[file_mgr_name, file_id.strip('/')])
                return JsonResponse({'href':
                                       '{}?preview=true'.format(preview_url)})
            else:
                return HttpResponseBadRequest('Preview not available for this item.')
        except HTTPError as e:
                logger.exception('Unable to preview file')
                return HttpResponseBadRequest(e.response.text)

    def get_download_url(self, file_id, **kwargs):
        file_type, path = self.parse_file_id(file_id)
        if file_type == 'file':
            download_url = self.dropbox_api.files_get_temporary_link(path)
            return {'href': download_url.link}
        return None

    #def import_file(self, file_id, from_resource, import_file_id, **kwargs):
    #    dropbox_upload.apply_async(args=(self._user.username,
    #                                 file_id,
    #                                 from_resource,
    #                                 import_file_id),
    #                           countdown=10)

    #    return {'message': 'Your file(s) have been scheduled for upload to box.'}


    def download_file(self, dropbox_file_path, download_directory_path):
        """
        Downloads the file for dropbox_file_path to the given download_path.

        :param dropbox_file_path:
        :param download_directory_path:
        :return: the full path to the downloaded file
        """
        dropbox_file = self.dropbox_api.files_get_metadata(dropbox_file_path)

        # convert utf-8 chars
        safe_filename = dropbox_file.name.encode(sys.getfilesystemencoding(), 'ignore')
        file_download_path = os.path.join(download_directory_path, safe_filename)
        logger.debug('Download file %s <= dropbox://file/%s', file_download_path, dropbox_file_path)

        self.dropbox_api.files_download_to_file(file_download_path,dropbox_file_path)

        return file_download_path


    def download_folder(self, path, download_path):
        """
        Recursively download the folder for path, and all of its contents, to the given
        download_path.

        :param path:
        :param download_path:
        :return:
        """
        dropbox_folder = self.dropbox_api.files_list_folder(path)
        has_more = dropbox_folder.has_more
        cursor = dropbox_folder.cursor
        dropbox_folder_metadata = self.dropbox_api.files_alpha_get_metadata(path)

        # convert utf-8 chars
        safe_dirname = dropbox_folder_metadata.name.encode(sys.getfilesystemencoding(), 'ignore')
        directory_path = os.path.join(download_path, safe_dirname)
        logger.debug('Creating directory %s <= dropbox://folder/%s', directory_path, path)
        try:
            os.mkdir(directory_path, 0o0755)
        except OSError as e:
            if e.errno == 17:  # directory already exists?
                pass
            else:
                logger.exception('Error creating directory: %s', directory_path)
                raise

        items = dropbox_folder.entries

        while True:
            for item in items:
                if type(item)==FileMetadata:
                    self.download_file(item.path_lower, directory_path)
                elif type(item)==FolderMetadata:
                    self.download_folder(item.path_lower, directory_path)
            if has_more:
                folder = self.dropbox_api.files_list_folder_continue(cursor)
                items = folder.entries
                has_more = items.has_more
                cursor = items.cursor
            else:
                break

        return directory_path

    def upload(self, username, src_file_id, dest_file_id):
        try:
            n = Notification(event_type='data',
                             status=Notification.INFO,
                             operation='dropbox_upload_start',
                             message='Starting uploading file %s to dropbox.' % (src_file_id,),
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

            file_type, path = self.parse_file_id(dest_file_id)
            if os.path.isfile(src_real_path):
                self.upload_file(path, src_real_path)
            elif os.path.isdir(src_real_path):
                self.upload_directory(path, src_real_path)
            else:
                logger.error('Unable to upload %s: file does not exist!',
                             src_real_path)

            n = Notification(event_type='data',
                             status=Notification.SUCCESS,
                             operation='dropbox_upload_end',
                             message='File %s has been copied to dropbox successfully!' % (src_file_id, ),
                             user=username,
                             extra={})
            n.save()
        except Exception as err:
            logger.exception('Unexpected task failure: dropbox_upload', extra={
                'username': username,
                'src_file_id': src_file_id,
                'dst_file_id': dest_file_id
            })
            n = Notification(event_type='data',
                             status=Notification.ERROR,
                             operation='dropbox_upload_error',
                             message='We were unable to get the specified file from dropbox. '
                                     'Please try again...',
                             user=username,
                             extra={})
            n.save()
            raise

    def upload_file(self, dropbox_path, file_real_path):
        file_path, file_name = os.path.split(file_real_path)
        with open(file_real_path, 'rb') as file_handle:
            f = file_handle.read()
            file_size = os.path.getsize(file_path)

            CHUNK_SIZE = 4 * 1024 * 1024 # 4MB

            if file_size <= CHUNK_SIZE:
                logger.debug('dropbox_path: %s, file_name: %s', dropbox_path, file_name),
                self.dropbox_api.files_upload(f, '%s/%s' % (dropbox_path, file_name))
            else:

                upload_session_start_result = self.dropbox_api.files_upload_session_start(f.read(CHUNK_SIZE))
                cursor = dropbox.files.UploadSessionCursor(session_id=upload_session_start_result.session_id,
                                                           offset=f.tell())
                commit = dropbox.files.CommitInfo(path=file_path)

                while f.tell() < file_size:
                    if ((file_size - f.tell()) <= CHUNK_SIZE):
                        print self.dropbox_api.files_upload_session_finish(f.read(CHUNK_SIZE), cursor, commit)
                    else:
                        self.dropbox_api.files_upload_session_append(f.read(CHUNK_SIZE), cursor.session_id, cursor.offset)
                        cursor.offset = f.tell()
            logger.info('Successfully uploaded %s to dropbox:folder/%s',
                        file_real_path, file_path)


    def upload_directory(self, dropbox_parent_folder, dir_real_path):
        """
        Recursively uploads the directory and all of its contents (subdirectories and files)
        to the dropbox folder specified by dropbox_parent_folder.

        :param dropbox_parent_folder: The dropbox folder to upload the directory to.
        :param dir_real_path: The real path on the filesystem of the directory to upload.
        :return:
        """

        dirparentpath, dirname = os.path.split(dir_real_path)
        # dropbox_parent_folder = self.dropbox_api.folder(dropbox_parent_folder)
        logger.info('Create directory %s in dropbox folder/%s', dirname, dropbox_parent_folder)
        # box_folder = box_parent_folder.create_subfolder(dirname)

        for dirpath, subdirnames, filenames in os.walk(dir_real_path):
            # upload all the files
            for filename in filenames:
                filepath = os.path.join(dirpath, filename)
                self.upload_file('%s/%s' % (dropbox_parent_folder, dirname), filepath)

            # upload all the subdirectories
            for subdirname in subdirnames:
                subdirpath = os.path.join(dirpath, subdirname)
                self.upload_directory('%s/%s' % (dropbox_parent_folder, dirname), subdirpath)

            # prevent further walk, because recursion
            subdirnames[:] = []

""" Google Drive filemanager"""
import os
import re
import sys
import logging
import io
import time
from designsafe.apps.data.tasks import agave_indexer
from designsafe.apps.api.exceptions import ApiException
from designsafe.apps.api.external_resources.googledrive.models.files import GoogleDriveFile
from designsafe.apps.api.notifications.models import Notification
from designsafe.apps.googledrive_integration.models import GoogleDriveUserToken
from django.contrib.auth import get_user_model
from django.core.urlresolvers import reverse
from django.http import (JsonResponse, HttpResponseBadRequest)
from requests import HTTPError
from googleapiclient.http import MediaFileUpload, MediaIoBaseDownload, HttpError
from future.utils import python_2_unicode_compatible

# pylint: disable=invalid-name
logger = logging.getLogger(__name__)
#pylint: enable=invalid-name


@python_2_unicode_compatible
class FileManager(object):

    NAME = 'googledrive'

    def __init__(self, user_obj, **kwargs):
        self._user = user_obj

        if user_obj.is_anonymous():
            raise ApiException(status=403, message='Log in required to access Google Drive files.')

        try:
            self.googledrive_api = user_obj.googledrive_user_token.client
        except GoogleDriveUserToken.DoesNotExist:
            message = 'Connect your Google Drive account <a href="' + reverse('googledrive_integration:index') + '">here</a>'
            raise ApiException(status=400, message=message, extra={
                'action_url': reverse('googledrive_integration:index'),
                'action_label': 'Connect Google Drive Account'
            })

    def parse_file_id(self, file_id):
        if file_id is not None:
            file_id = file_id.strip('/')
            try:
                file_type, file_id = GoogleDriveFile.parse_file_id(file_id)
            except AssertionError:
                # file path is hierarchical; need to find the GoogleDriveObject here
                logger.debug('parse_file_id, file_id:{}'.format(file_id))
                fields = "mimeType, name, id, modifiedTime, fileExtension, size, parents"
                googledrive_item = GoogleDriveFile(self.googledrive_api.files().get(fileId=file_id, fields=fields).execute(), drive=self.googledrive_api)

                file_type = googledrive_item.type
        else:
            file_type, file_id = 'folder', 'root'

        return file_type, file_id

    def listing(self, file_id=None, **kwargs):
        """
        Lists contents of a folder or details of a file.

        Args:
            file_id: The type/id of the Google Drive Object. This should be formatted {type}/{id}
            where {type} is one of ['folder', 'file'] and {id} is the numeric Google Drive ID for
            the object.

        Returns:
            Dictionary with two keys;
              - resource: File System resource that we're listing
              - files: Array of Api file-like objects
        """

        default_pems = 'ALL'

        try:
            if file_id == '/':
                # top level dir
                file_id = 'root'

            file_type, file_id = self.parse_file_id(file_id)
            fields = "mimeType, name, id, modifiedTime, fileExtension, size, parents"
            googledrive_item = self.googledrive_api.files().get(fileId=file_id, fields=fields).execute()

            child_results = self.googledrive_api.files().list(q="'{}' in parents and trashed=False".format(file_id), fields="files({})".format(fields)).execute()
            if file_type == 'folder':

                children = [GoogleDriveFile(item, parent=googledrive_item, drive=self.googledrive_api).to_dict(default_pems=default_pems)
                            for item in child_results['files']]
                child_folders = sorted([item for item in children if item['type'] == 'folder'], key=lambda k: os.path.splitext(k['name'])[0])
                child_files = sorted([item for item in children if item['type'] == 'file'], key=lambda k: os.path.splitext(k['name'])[0])
                children = child_folders + child_files
            else:
                children = None

            list_data = GoogleDriveFile(googledrive_item, drive=self.googledrive_api).to_dict(default_pems=default_pems)

            if children:
                list_data['children'] = children

            return list_data

        except AssertionError:
            raise ApiException(status=404, message='The file you requested does not exist.')

        except Exception as e:
            if 'invalid_grant' in str(e):
                message = 'While you previously granted this application access to Google Drive, ' \
                    'that grant appears to be no longer valid. Please ' \
                    '<a href="{}">disconnect and reconnect your Google Drive account</a> ' \
                    'to continue using Google Drive data.'.format(reverse('googledrive_integration:index'))
                raise ApiException(status=401, message=message)

            message = 'Unable to communicate with Google Drive: {}'.format(e)
            raise ApiException(status=500, message=message)

    def file(self, file_id, action, path=None, **kwargs):
        pass

    def is_shared(self, *args, **kwargs):
        return False

    def is_search(self, *args, **kwargs):
        return False

    def copy(self, username, src_file_id, dest_file_id, **kwargs):
        try:
            file_type, file_id = self.parse_file_id(file_id=src_file_id)

            googledrive_item = self.googledrive_api.files().get(fileId=file_id, fields="name").execute()
            n = Notification(event_type='data',
                             status=Notification.INFO,
                             operation='googledrive_download_start',
                             message='Starting copy of {} {} from Google Drive.'.format(file_type, googledrive_item['name']),
                             user=username,
                             extra={})
            n.save()
            logger.debug('username: {}, filename: {}, src_file_id: {}, dest_file_id: {}'.format(username, googledrive_item['name'], src_file_id, dest_file_id))
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

            downloaded_file_path = None
            if file_type == 'file':
                downloaded_file_path = self.download_file(file_id, dest_real_path, username)
                if downloaded_file_path is None:
                    return None

            elif file_type == 'folder':
                downloaded_file_path = self.download_folder(file_id, dest_real_path, username)

            n = Notification(event_type='data',
                             status=Notification.SUCCESS,
                             operation='googledrive_download_end',
                             message='{} "{}" was copied from Google Drive successfully!'.format(file_type.capitalize(), googledrive_item['name']),
                             user=username,
                             extra={})
            n.save()
            if re.search(r'^project-', agave_system_id):
                project_dir = agave_system_id.replace('project-', '', 1)
                project_dir = os.path.join(base_mounted_path.strip('/'), project_dir)
                agave_file_path = downloaded_file_path.replace(project_dir, '', 1).strip('/')
            else:
                agave_file_path = downloaded_file_path.replace(base_mounted_path, '', 1).strip('/')

            if not agave_file_path.startswith('/'):
                agave_file_path = '/' + agave_file_path

            agave_indexer.apply_async(kwargs={'username': user.username, 'systemId': agave_system_id, 'filePath': os.path.dirname(agave_file_path), 'recurse': False}, queue='indexing')
            agave_indexer.apply_async(kwargs={'systemId': agave_system_id, 'filePath': agave_file_path, 'recurse': True}, routing_key='indexing')
        except Exception as e:
            logger.exception('Unexpected task failure: googledrive_copy', extra={
                'username': username,
                'file_id': src_file_id,
                'dest_file_id': dest_file_id,
                'error_type': type(e),
                'error': str(e)
            })
            n = Notification(event_type='data',
                             status=Notification.ERROR,
                             operation='googledrive_copy_error',
                             message='We were unable to copy the file from Google Drive. '
                                     'Please try again...',
                             user=username,
                             extra={'path': googledrive_item['name']})
            n.save()
            raise

    def move(self, file_id, **kwargs):
        raise ApiException('Moving Google Drive files is not supported.', status=400,
                           extra={'file_id': file_id,
                                  'kwargs': kwargs})

    def get_preview_url(self, file_id, **kwargs):
        file_type, file_id = self.parse_file_id(file_id)
        if file_type == 'file':
            googledrive_file = self.googledrive_api.files().get(fileId=file_id, fields="webViewLink, ownedByMe").execute()

            # if user owns file, make file viewable by anyone with link to allow designsafe to preview the file
            if googledrive_file['ownedByMe']:
                file_pems = self.googledrive_api.permissions().list(fileId=file_id).execute()['permissions']
                if 'anyoneWithLink' not in [pem['id'] for pem in file_pems]:
                    body = {'role': 'reader',
                            'type': 'anyone'}
                    update_pems = self.googledrive_api.permissions().create(fileId=file_id, body=body).execute()
            return {'href': googledrive_file['webViewLink'].replace('view?usp=drivesdk', 'preview').replace('edit?usp=drivesdk', 'preview')}
        return None

    def preview(self, file_id, file_mgr_name, **kwargs):
        try:
            file_type, file_id = self.parse_file_id(file_id)
            # googledrive_file = GoogleDriveFile(self.googledrive_api.files().get(fileId=file_id, fields=fields).execute(), drive=self.googledrive_api)
            if file_type == 'file':  # googledrive_file.previewable:
                preview_url = reverse('designsafe_api:box_files_media',
                                      args=[file_mgr_name, file_id.strip('/')])
                return JsonResponse({'href':
                                     '{}?preview=true'.format(preview_url)})
            else:
                return HttpResponseBadRequest('Preview not available for this item.')
        except HTTPError as e:
            logger.exception('Unable to preview file:{}'.format(e))
            return HttpResponseBadRequest(e.response.text)

    def get_download_url(self, file_id, **kwargs):
        file_type, file_id = self.parse_file_id(file_id)
        if file_type == 'file':
            googledrive_file = self.googledrive_api.files().get(fileId=file_id, fields="webContentLink, ownedByMe, mimeType, name").execute()

            # if user owns file, make file viewable by anyone with link to allow user to download the file
            if googledrive_file['ownedByMe']:
                file_pems = self.googledrive_api.permissions().list(fileId=file_id).execute()['permissions']
                if 'anyoneWithLink' not in [pem['id'] for pem in file_pems]:
                    body = {'role': 'reader',
                            'type': 'anyone'}
                    update_pems = self.googledrive_api.permissions().create(fileId=file_id, body=body).execute()

            if 'webContentLink' in googledrive_file:
                return {'href': googledrive_file['webContentLink']}
            else:
                n = Notification(event_type='data',
                                 status=Notification.ERROR,
                                 operation='googledrive_download_error',
                                 message='Downloading Google-type files is currently unsupported. Convert the file to'
                                 ' a standard format and try again.',
                                 user=kwargs['username'],
                                 extra={'path': googledrive_file['name']})  # show file in Notification
                n.save()
                return None

        return None

    def download_file(self, file_id, download_directory_path, username):
        """
        Downloads the file for file_id to the given download_path.

        :param file_id:
        :param download_directory_path:
        :return: the full path to the downloaded file
        """
        googledrive_file = self.googledrive_api.files().get(fileId=file_id, fields="name, mimeType").execute()

        # convert utf-8 chars
        safe_filename = googledrive_file['name'].encode(sys.getfilesystemencoding(), 'ignore')
        file_download_path = os.path.join(download_directory_path, safe_filename)
        logger.debug('Download file %s <= googledrive://file/%s', file_download_path, file_id)

        if 'vnd.google-apps' in googledrive_file['mimeType']:
            # if googledrive_file['mimeType'] == 'application/vnd.google-apps.spreadsheet':
            #     mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            # elif googledrive_file['mimeType'] == 'application/vnd.google-apps.document':
            #     mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            # elif googledrive_file['mimeType'] == 'application/vnd.google-apps.presentation':
            #     mimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
            # else:
            n = Notification(event_type='data',
                             status=Notification.ERROR,
                             operation='googledrive_download_error',
                             message='Copying Google-type files is currently unsupported. Export the file to'
                             ' a standard format and try again.',
                             user=username,
                             extra={'path': "'{}' of type {}".format(googledrive_file['name'], googledrive_file['mimeType'])})
            n.save()
            return None

        request = self.googledrive_api.files().get_media(fileId=file_id)

        # Incremental Partial Download
        fh = io.FileIO(file_download_path, 'wb')
        downloader = MediaIoBaseDownload(fh, request)
        done = False
        backoff_attempts = 0
        while done is False:
            try:
                status, done = downloader.next_chunk()
                # logger.debug('status: {} percent'.format(status.progress()))
            except HttpError as e:
                # Incremental backoff for exceeding google api rate limit
                if "Rate Limit Exceeded" in str(e):
                    logger.debug('RATE LIMIT EXCEEDED')
                    backoff_attempts += 1
                    time.sleep(backoff_attempts)
                    if backoff_attempts > 10:
                        n = Notification(event_type='data',
                                         status=Notification.ERROR,
                                         operation='googledrive_download_error',
                                         message='Rate Limit Exceeded. Try again after a few minutes for this file.',
                                         user=username,
                                         extra={'path': "{}".format(googledrive_file['name'])})
                        n.save()
                        return None
                elif "Only files with binary content can be downloaded" in str(e):
                    n = Notification(event_type='data',
                                     status=Notification.ERROR,
                                     operation='googledrive_download_error',
                                     message='Only files with binary content can be downloaded. Convert the file to'
                                     ' a standard format and try again.',
                                     user=username,
                                     extra={'path': "'{}' of type {}".format(googledrive_file['name'], googledrive_file['mimeType'])})
                    n.save()
                    return None
                else:
                    raise

        fh.close()

        return file_download_path

    def download_folder(self, folder_id, download_path, username):
        """
        Recursively download the folder for folder_id, and all of its contents, to the given
        download_path.

        :param folder_id:
        :param download_path:
        :return:
        """
        googledrive_folder = self.googledrive_api.files().get(fileId=folder_id, fields="name").execute()
        # convert utf-8 chars
        safe_dirname = googledrive_folder['name'].encode(sys.getfilesystemencoding(), 'ignore')
        directory_path = os.path.join(download_path, safe_dirname)
        logger.debug('Creating directory %s <= googledrive://folder/%s', directory_path, folder_id)
        try:
            os.mkdir(directory_path, 0o0755)
        except OSError as e:
            if e.errno == 17:  # directory already exists?
                pass
            else:
                logger.exception('Error creating directory: %s', directory_path)
                raise

        items = self.googledrive_api.files().list(q="'{}' in parents and trashed=False".format(folder_id)).execute()
        for item in items['files']:
            if item['mimeType'] == 'application/vnd.google-apps.folder':
                self.download_folder(item['id'], directory_path, username)
            else:
                try:
                    self.download_file(item['id'], directory_path, username)
                    logger.info('Google File download complete: {}'.format('/'.join([directory_path, item['id']])))
                except Exception as e:
                    logger.exception('Unexpected task failure: googledrive_download', extra={
                        'username': username,
                        'file_id': item['id'],
                        'dest_file_id': '/'.join([directory_path, item['id']]),
                        'error_type': type(e),
                        'error': str(e)
                    })
                    n = Notification(event_type='data',
                                     status=Notification.ERROR,
                                     operation='googledrive_download_error',
                                     message='We were unable to download file from Google Drive. '
                                     'Please try again...',
                                     user=username,
                                     extra={'path': item['name']})
                    n.save()
                    raise

        return directory_path

    def upload(self, username, src_file_id, dest_folder_id):
        try:
            n = Notification(event_type='data',
                             status=Notification.INFO,
                             operation='googledrive_upload_start',
                             message='Uploading file %s to Google Drive.' % (src_file_id,),
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
            logger.debug('dest_folder_id:{}'.format(dest_folder_id))

            if dest_folder_id == '':
                dest_folder_id = 'root'

            file_type, folder_id = self.parse_file_id(file_id=dest_folder_id.strip('/'))
            if os.path.isfile(src_real_path):
                self.upload_file(folder_id, src_real_path)
            elif os.path.isdir(src_real_path):
                self.upload_directory(folder_id, src_real_path)
            else:
                logger.error('Unable to upload %s: file does not exist!',
                             src_real_path)

            n = Notification(event_type='data',
                             status=Notification.SUCCESS,
                             operation='googledrive_upload_end',
                             message='File "%s" was copied to Google Drive successfully!' % (src_file_id, ),
                             user=username,
                             extra={})
            n.save()
        except Exception as err:
            logger.exception('Unexpected task failure: googledrive_upload', extra={
                'username': username,
                'src_file_id': src_file_id,
                'dst_file_id': dest_folder_id,
                'error': err
            })
            n = Notification(event_type='data',
                             status=Notification.ERROR,
                             operation='googledrive_upload_error',
                             message='We were unable to upload the specified file to Google Drive. '
                                     'Please try again...',
                             user=username,
                             extra={})
            n.save()
            raise

    def upload_file(self, folder_id, file_real_path):

        file_path, file_name = os.path.split(file_real_path)
        file_metadata = {'name': file_name, 'parents': [folder_id]}
        logger.debug('file_metadata:{}'.format(file_metadata))
        mimetype = None
        if not os.path.splitext(file_name)[1]:
            # Required for files with names like '.astylerc'
            mimetype = "text/plain"

        CHUNK_SIZE = 5 * 1024 * 1024  # 5MB
        file_size = os.path.getsize(file_path)

        if file_size < CHUNK_SIZE:
            media = MediaFileUpload(file_real_path, mimetype=mimetype)
            uploaded_file = self.googledrive_api.files().create(body=file_metadata, media_body=media, fields='id').execute()
            logger.info('Successfully uploaded %s to googledrive:folder/%s as googledrive:file/%s',
                        file_real_path, folder_id, uploaded_file.get('id'))
        else:
            media = MediaFileUpload(file_real_path, mimetype=mimetype, resumable=True)
            request = self.googledrive_api.files().create(body=file_metadata, media_body=media, fields='id').execute()
            media.stream()
            response = None
            while response is None:
                status, response = request.next_chunck()
                if status:
                    logger.debug("Uploaded {}%% to google drive".format(status.progress() * 100))
            logger.info('Successfully uploaded %s to googledrive:folder/%s as googledrive:file/%s',
                        file_real_path, folder_id, response['id'])

    def upload_directory(self, parent_folder_id, dir_real_path):
        """
        Recursively uploads the directory and all of its contents (subdirectories and files)
        to the Google Drive folder specified by parent_folder_id.

        :param parent_folder_id: The Google Drive folder to upload the directory to.
        :param dir_real_path: The real path on the filesystem of the directory to upload.
        :return: The new Google Drive folder.
        """

        dirparentpath, dirname = os.path.split(dir_real_path)
        logger.info('Create directory %s in Google Drive folder/%s', dirname, parent_folder_id)

        folder_metadata = {'name': dirname, 'parents': parent_folder_id, 'mimeType': 'application/vnd.google-apps.folder'}

        googledrive_folder = self.googledrive_api.files().create(body=folder_metadata, fields='id').execute()

        for dirpath, subdirnames, filenames in os.walk(dir_real_path):
            # upload all the files
            for filename in filenames:
                filepath = os.path.join(dirpath, filename)
                self.upload_file(googledrive_folder['id'], filepath)

            # upload all the subdirectories
            for subdirname in subdirnames:
                subdirpath = os.path.join(dirpath, subdirname)
                self.upload_directory(googledrive_folder['id'], subdirpath)

            # prevent further walk, because recursion
            subdirnames[:] = []

        return googledrive_folder

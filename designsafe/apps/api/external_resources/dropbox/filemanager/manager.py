""" Dropbox filemanager"""
import os
import sys
import logging
from designsafe.apps.api.exceptions import ApiException
from designsafe.apps.api.external_resources.dropbox.models.files import DropboxFile
#from designsafe.apps.api.tasks import dropbox_upload
from designsafe.apps.dropbox_integration.models import DropboxUserToken
from dropbox.exceptions import ApiError, AuthError
from dropbox.files import ListFolderResult, FileMetadata
from dropbox.dropbox import Dropbox
from dropbox.oauth import DropboxOAuth2Flow, BadRequestException, BadStateException, CsrfException, NotApprovedException, ProviderException
from django.core.urlresolvers import reverse

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
            message = 'You need to connect your Dropbox.com account ' \
                      'before you can access your Dropbox.com files.'
            raise ApiException(status=400, message=message, extra={
                'action_url': reverse('dropbox_integration:index'),
                'action_label': 'Connect Dropbox.com Account'
            })

    def parse_file_id(self, path):
        if path != '/':
            try:
                file_type, path = DropboxFile.parse_file_id(path)
            except AssertionError:
                # file path is hierarchical; need to find the DropboxObject here
                dropbox_item = DropboxFile(self.dropbox_api.files_list_folder(path))
                file_type = dropbox_item.type
                return file_type, path
        else:
            file_type, path = u'folder', u''

        return file_type, path

    def listing(self, path='', **kwargs):
        """
        Lists contents of a folder or details of a file.

        Args:
            file_id: The type/id of the Dropbox Object. This should be formatted {type}/{id}
            where {type} is one of ['folder', 'file'] and {id} is the numeric Dropbox ID for
            the object.

        Returns:
            Dictionary with two keys;
              - resource: File System resource that we're listing
              - files: Array of Api file-like objects
        """

        default_pems = 'ALL'

        try:
            file_type, path = self.parse_file_id(path)
            dropbox_item = self.dropbox_api.files_list_folder(path)
            # if path:
                # item_metadata = self.dropbox_api.files_alpha_get_metadata(path)

            if path == '':
                file_type = 'folder'
            else:
                item_metadata = self.dropbox_api.files_alpha_get_metadata(path)
                children = None

            if file_type =='folder':
                children = [DropboxFile(item, item.path_display, parent=dropbox_item).to_dict(default_pems=default_pems)
                            for item in dropbox_item.entries]
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
            import ipdb; ipdb.set_trace()
            if e.error.get_path().is_not_folder():
                list_data = self.dropbox_api.files_get_metadata(path)
                return list_data

            message = 'Unable to communicate with Dropbox: %s' % e.message
            raise ApiException(status=500, message=message)

    def file(self, file_id, action, path=None, **kwargs):
        pass

    def is_shared(self, *args, **kwargs):
        return False

    def is_search(self, *args, **kwargs):
        return False

    def copy(self, file_id, dest_resource, dest_file_id, **kwargs):
        # can only transfer out of box
        from designsafe.apps.api.data import lookup_transfer_service
        service = lookup_transfer_service(self.NAME, dest_resource)
        if service:
            args = (self._user.username,
                    self.NAME, file_id,
                    dest_resource, dest_file_id)
            service.apply_async(args=args)
            return {'message': 'The requested transfer has been scheduled'}
        else:
            message = 'The requested transfer from %s to %s ' \
                      'is not supported' % (self.NAME, dest_resource)
            extra = {'file_id': file_id,
                     'dest_resource': dest_resource,
                     'dest_file_id': dest_file_id}
            raise ApiException(message, status=400, extra=extra)

    def move(self, file_id, **kwargs):
        raise ApiException('Moving Dropbox files is not supported.', status=400,
                           extra={'file_id': file_id,
                                  'kwargs': kwargs})

    def preview(self, file_id, **kwargs):
        file_type, file_id = self.parse_file_id(file_id)
        if file_type == 'file':
            embed_url = self.dropbox_api.file(file_id).get(fields=['expiring_embed_link'])
            return {'href': embed_url._response_object['expiring_embed_link']['url']}
        return None

    def download(self, file_id, **kwargs):
        file_type, file_id = self.parse_file_id(file_id)
        if file_type == 'file':
            download_url = self.dropbox_api.file(file_id).get_shared_link_download_url()
            return {'href': download_url}
        return None

    #def import_file(self, file_id, from_resource, import_file_id, **kwargs):
    #    dropbox_upload.apply_async(args=(self._user.username,
    #                                 file_id,
    #                                 from_resource,
    #                                 import_file_id),
    #                           countdown=10)

    #    return {'message': 'Your file(s) have been scheduled for upload to box.'}


    def download_file(self, dropbox_file_id, download_directory_path):
        """
        Downloads the file for dropbox_file_id to the given download_path.

        :param dropbox_file_manager:
        :param dropbox_file_id:
        :param download_directory_path:
        :return: the full path to the downloaded file
        """
        dropbox_file = self.dropbox_api.file(dropbox_file_id).get()
        # convert utf-8 chars
        safe_filename = dropbox_file.name.encode(sys.getfilesystemencoding(), 'ignore')
        file_download_path = os.path.join(download_directory_path, safe_filename)
        logger.debug('Download file %s <= box://file/%s', file_download_path, dropbox_file_id)

        with open(file_download_path, 'wb') as download_file:
            dropbox_file.download_to(download_file)

        return file_download_path


    def download_folder(self, dropbox_folder_id, download_path):
        """
        Recursively the folder for dropbox_folder_id, and all of its contents, to the given
        download_path.

        :param dropbox_file_manager:
        :param dropbox_folder_id:
        :param download_path:
        :return:
        """
        dropbox_folder = self.dropbox_api.folder(dropbox_folder_id).get()
        # convert utf-8 chars
        safe_dirname = dropbox_folder.name.encode(sys.getfilesystemencoding(), 'ignore')
        directory_path = os.path.join(download_path, safe_dirname)
        logger.debug('Creating directory %s <= box://folder/%s', directory_path, dropbox_folder_id)
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
            items = dropbox_folder.get_items(limit, offset)
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

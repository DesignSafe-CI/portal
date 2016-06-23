from designsafe.apps.api.data.abstract.filemanager import AbstractFileManager
from designsafe.apps.api.exceptions import ApiException
from designsafe.apps.api.data.box.file import BoxFile
from designsafe.apps.api.tasks import box_upload
from designsafe.apps.box_integration import util
from designsafe.apps.box_integration.models import BoxUserToken
from boxsdk.exception import BoxException, BoxOAuthException
from django.core.urlresolvers import reverse
import logging
import os

logger = logging.getLogger(__name__)


class FileManager(AbstractFileManager):

    resource = 'box'

    def __init__(self, user_obj, **kwargs):
        super(FileManager, self).__init__()
        self._user = user_obj

        if user_obj.is_anonymous():
            raise ApiException(status=403, message='Log in required to access Box files.')

        try:
            self.box_api = util.get_box_client(user_obj)
        except BoxUserToken.DoesNotExist:
            message = 'You need to connect your Box.com account ' \
                      'before you can access your Box.com files.'
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

        default_pems = [{
            'username': self._user.username,
            'recursive': True,
            'permission': {
                'read': True,
                'write': True,
                'execute': True
            }
        }]

        try:
            file_type, file_id = self.parse_file_id(file_id)

            box_op = getattr(self.box_api, file_type)
            box_item = box_op(file_id).get()
            if file_type == 'folder':
                limit = int(kwargs.pop('limit', 100))
                offset = int(kwargs.pop('offset', 0))
                limit = offset + limit

                children = [BoxFile(item, parent=box_item).to_dict(default_pems=default_pems)
                            for item in box_item.get_items(limit, offset = offset)]
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

    def file(self, file_id, action, path = None, **kwargs):
        pass

    def copy(self, file_id, dest_resource, dest_file_id, **kwargs):
        # can only transfer out of box
        from designsafe.apps.api.data import lookup_transfer_service
        service = lookup_transfer_service(self.resource, dest_resource)
        if service:
            args = (self._user.username,
                    self.resource, file_id,
                    dest_resource, dest_file_id)
            service.apply_async(args=args)
            return {'message': 'The requested transfer has been scheduled'}
        else:
            message = 'The requested transfer from %s to %s ' \
                      'is not supported' % (self.resource, dest_resource)
            extra = {'file_id': file_id,
                     'dest_resource': dest_resource,
                     'dest_file_id': dest_file_id}
            raise ApiException(message, status=400, extra=extra)

    def move(self, file_id, **kwargs):
        raise ApiException('Moving Box files is not supported.', status=400,
                           extra={'file_id': file_id,
                                  'kwargs': kwargs})

    def preview(self, file_id, **kwargs):
        file_type, file_id = self.parse_file_id(file_id)
        if file_type == 'file':
            embed_url = self.box_api.file(file_id).get(fields=['expiring_embed_link'])
            return {'href': embed_url._response_object['expiring_embed_link']['url']}
        return None

    def download(self, file_id, **kwargs):
        file_type, file_id = self.parse_file_id(file_id)
        if file_type == 'file':
            download_url = self.box_api.file(file_id).get_shared_link_download_url()
            return {'href': download_url}
        return None

    def import_file(self, file_id, from_resource, import_file_id, **kwargs):
        box_upload.apply_async(args=(self._user.username,
                                     file_id,
                                     from_resource,
                                     import_file_id),
                               countdown=10)

        return {'message': 'Your file(s) have been scheduled for upload to box.'}

    def search(self, q, **kwargs):
        pass


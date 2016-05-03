from designsafe.apps.api.data.abstract.filemanager import AbstractFileManager
from designsafe.apps.api.exceptions import ApiException
from designsafe.apps.api.data.box.file import BoxFile
from designsafe.apps.box_integration import util
from boxsdk.exception import BoxAPIException
import logging

logger = logging.getLogger(__name__)


class FileManager(AbstractFileManager):

    resource = 'box'

    def __init__(self, user_obj, **kwargs):
        super(FileManager, self).__init__()
        self.box_api = util.get_box_client(user_obj)

    def listing(self, file_path, **kwargs):
        """
        Lists contents of a folder or details of a file.

        Args:
            file_path: The type/id of the Box Object. This should be formatted {type}/{id}
            where {type} is one of ['folder', 'file'] and {id} is the numeric Box ID for
            the object.

        Returns:
            Dictionary with two keys;
              - resource: File System resource that we're listing
              - files: Array of Api file-like objects
        """

        try:
            if file_path:
                file_type, file_id = BoxFile.parse_file_path(file_path)
            else:
                file_type, file_id = u'folder', u'0'
            box_op = getattr(self.box_api, file_type)
            box_item = box_op(file_id).get()
            if file_type == 'folder':
                children = [BoxFile(item, parent=box_item).to_dict()
                            for item in box_item.get_items(100)]
            else:
                children = None

            list_data = BoxFile(box_item).to_dict()
            if children:
                list_data['children'] = children

            return {
                'resource': self.resource,
                'listing': list_data
            }
        except AssertionError:
            raise ApiException('Invalid file_path for Box item: {0}'.format(file_path))
        except BoxAPIException as e:
            raise ApiException(e.message)

    def file(self, file_path, action, path = None, **kwargs):
        pass

    def download(self, file_path, **kwargs):
        pass

    def search(self, q, **kwargs):
        pass


from agavepy.agave import AgaveException, Agave
from agavepy.async import AgaveAsyncResponse, TimeoutError, Error
from designsafe.apps.api.exceptions import ApiException
from designsafe.apps.api.data.agave.agave_object import AgaveObject
from designsafe.apps.api.data.agave.file import AgaveFile
from designsafe.apps.api.data.abstract.filemanager import AbstractFileManager
from django.conf import settings
import urllib
import os
import logging
logger = logging.getLogger(__name__)

FILESYSTEMS = {
    'default': getattr(settings, 'AGAVE_STORAGE_SYSTEM')
}


class FileManager(AbstractFileManager, AgaveObject):

    resource = 'agave'

    def __init__(self, user_obj, **kwargs):
        super(FileManager, self).__init__(**kwargs)
        username = user_obj.username
        if user_obj.agave_oauth.expired:
            user_obj.agave_oauth.referer()

        token = user_obj.agave_oauth
        access_token = token.access_token
        agave_url = getattr(settings, 'AGAVE_TENANT_BASEURL')
        self.agave_client = Agave(api_server = agave_url, token = access_token)
        self.username = username

    def is_shared(self, file_path):
        if file_path is not None and file_path != '':
            components = file_path.strip('/').split('/')
            if len(components) > 1 and components[0] == settings.AGAVE_STORAGE_SYSTEM:
                if components[1] == self.username:
                    return False
                else:
                    return True
        return False

    def listing(self, file_path=None, **kwargs):
        """
        Lists contents of a folder or details of a file.

        Args:
            file_path: String of file path to list

        Returns:
            Dictionary with two keys;
              - resource: File System resource that we're listing
              - files: Array of serializabe Api file-like objects
        """

        if file_path is None or file_path == '':
            system_id = settings.AGAVE_STORAGE_SYSTEM
            listing_path = self.username
        else:
            components = file_path.strip('/').split('/')  # remove leading/trailing /
            system_id = components[0]
            listing_path = '/'.join(components[1:]) if len(components) > 1 else self.username

        listing = self.call_operation('files.list',
                                      systemId=system_id,
                                      filePath=urllib.quote(listing_path))

        # files = [AgaveFile(wrap=o, resource=self.resource)
        #          for o in listing if o['name'] != '.']
        # home = file_path.split('/')[0]
        # if home == self.username:
        #     resource = 'default'
        # else:
        #     resource = 'shared'
        # return {
        #     'resource': resource,
        #     'files': [f.to_dict() for f in files]
        # }

        root_listing = AgaveFile(wrap=listing[0])
        if root_listing.name == '.':
            root_listing.name = root_listing.path.split('/')[-1]
        list_data = root_listing.to_dict()
        list_data['children'] = [AgaveFile(wrap=o).to_dict() for o in listing[1:]]
        return list_data

    def search(self, **kwargs):
        return [{}]

    def download(self, **kwargs):
        pass

    def file(self, **kwargs):
        pass

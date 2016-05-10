from agavepy.agave import AgaveException, Agave
from agavepy.async import AgaveAsyncResponse, TimeoutError, Error
from designsafe.apps.api.exceptions import ApiException
from designsafe.apps.api.data.agave.agave_object import AgaveObject
from designsafe.apps.api.data.agave.file import AgaveFile
from designsafe.apps.api.data.abstract.filemanager import AbstractFileManager
from designsafe.apps.api.data.agave.decorators import file_id_decorator
from django.conf import settings
from functools import wraps
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
        self.agave_client = Agave(api_server = agave_url, 
                                  token = access_token)
        self.username = username

    @staticmethod
    def is_shared(file_id):
        file_id = self._parse_file_id(file_id)
        return file_id[0] == settings.AGAVE_STORAGE_SYSTEM and file_id[1] == self.username
    
    @file_id_decorator        
    def listing(self, system, file_path, file_user, **kwargs):
        """
        Lists contents of a folder or details of a file.

        Args:
            file_path: String of file path to list

        Returns:
            Dictionary with two keys;
              - resource: File System resource that we're listing
              - files: Array of serializabe Api file-like objects
        """
        listing = self.call_operation('files.list',
                                      systemId=system,
                                      filePath=file_path)

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

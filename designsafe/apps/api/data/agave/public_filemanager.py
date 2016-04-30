from agavepy.agave import AgaveException, Agave
from agavepy.async import AgaveAsyncResponse, TimeoutError, Error
from designsafe.apps.api.exceptions import ApiException
from designsafe.apps.api.data.agave.agave_object import AgaveObject
from designsafe.apps.api.data.agave.file import AgaveFile
from django.conf import settings
import urllib
import os
import logging
logger = logging.getLogger(__name__)

class FileManager(AgaveObject):
    def __init__(self, user_obj, **kwargs):
        super(FileManager, self).__init__(**kwargs)
        username = user_obj.username
        if user_obj.agave_oauth.expired:
            user_obj.agave_oauth.referer()

        token = user_obj.agave_oauth
        access_token = token.access_token
        agave_url = getattr(settings, 'AGAVE_TENANT_BASEURL')
        self.resource = kwargs.get('resource')
        self.system_id = 'nees.public'
        self.agave_client = Agave(api_server = agave_url, token = access_token)
        self.username = username

    def listing(self, file_path, **kwargs):
        """
        Lists contents of a folder or details of a file.

        Args:
            file_path: String of file path to list

        Returns:
            Dictionary with two keys;
              - resource: File System resource that we're listing
              - files: Array of Api file-like objects
        """
        file_path = file_path.strip('/')
        listing = self.call_operation('files.list', 
                                systemId = self.system_id,
                                filePath = urllib.quote(file_path))
        files = [AgaveFile(wrap = o, resource = self.resource) for o in listing if o['name'] != '.']
        return {
            'resource': 'public',
            'files': [f.to_dict() for f in files]
        }


    def search(self, **kwargs):
        return [{}]

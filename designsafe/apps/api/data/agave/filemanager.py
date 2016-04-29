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

FILESYSTEMS = {
    'default': getattr(settings, 'AGAVE_STORAGE_SYSTEM')
} 
class FileManager(AgaveObject):
    def __init__(self, request, **kwargs):
        super(FileManager, self).__init__(**kwargs)
        user_obj = request.user
        username = user_obj.username
        if user_obj.agave_oauth.expired:
            user_obj.agave_oauth.referer()

        token = user_obj.agave_oauth
        access_token = token.access_token
        agave_url = getattr(settings, 'AGAVE_TENANT_BASEURL')
        self.resource = kwargs.get('resource')
        self.system_id = FILESYSTEMS[self.resource]
        self.agave_client = Agave(api_server = agave_url, token = access_token)
        self.username = username

    def listing(self, file_path, **kwargs):
        file_path = file_path.strip('/')
        listing = self.call_operation('files.list', 
                                systemId = self.system_id,
                                filePath = urllib.quote(file_path))
        return [AgaveFile(wrap = o, resource = self.resource) for o in listing if o['name'] != '.']

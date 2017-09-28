"""File Manager for published Data
"""

import logging
import json
import os
import re
import datetime
from django.conf import settings
from .base import BaseFileManager
from designsafe.apps.api.agave.filemanager.agave import  AgaveFileManager
from designsafe.apps.api.exceptions import ApiException
from designsafe.apps.api.agave.filemanager.public_search_index import Publication

logger = logging.getLogger(__name__)

class PublishedFileManager(AgaveFileManager):
    NAME = 'community'
    DEFAULT_SYSTEM_ID = 'designsafe.storage.published'
    
    def listing(self, system, file_path, offset=0, limit=100):
        path_comps = file_path.strip('/').split('/')
        if len(path_comps) < 1:
            raise ApiException(messsage='Invalid Action', status=400)
        #elif len(path_comps) == 1:
        #    project_id = path_comps[0]
        #    publication = Publication(project_id=project_id)
        #    return publication
        else:
            return super(PublishedFileManager, self).\
                        listing(system, file_path, offset, limit)

    def delete(self, *args, **kwargs):
        return ApiException(messsage='Invalid Action', status=400)

    def mkdir(self, *args, **kwargs):
        return ApiException(messsage='Invalid Action', status=400)

    def move(self, *args, **kwargs):
        return ApiException(messsage='Invalid Action', status=400)

    def rename(self, *args, **kwargs):
        return ApiException(messsage='Invalid Action', status=400)

    def share(self, *args, **kwargs):
        return ApiException(messsage='Invalid Action', status=400)

    def trash(self, *args, **kwargs):
        return ApiException(messsage='Invalid Action', status=400)

    def upload(self, *args, **kwargs):
        return ApiException(messsage='Invalid Action', status=400)

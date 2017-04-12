"""File Manager for community Data
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

logger = logging.getLogger(__name__)

class CommunityFileManager(AgaveFileManager):
    NAME = 'community'
    DEFAULT_SYSTEM_ID = 'designsafe.storage.community'
    def copy(self, *args, **kwargs):
        return ApiException(messsage='Invalid Action', status=400)

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

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


logger = logging.getLogger(__name__)

class PublishedFileManager(AgaveFileManager):
    NAME = 'published_files'
    DEFAULT_SYSTEM_ID = 'designsafe.storage.published'

    @property
    def requires_auth(self):
        """Whether it should check for an authenticated user.

        If this is a public data file manager, it should return False.
        """
        return False

    def listing(self, system, file_path='/', offset=0, limit=100, **kwargs):
        return super(PublishedFileManager, self).\
                listing(system, file_path, offset, limit)

    def delete(self, *args, **kwargs):
        raise ApiException('Invalid Action', status=400)

    def mkdir(self, *args, **kwargs):
        raise ApiException('Invalid Action', status=400)

    def move(self, *args, **kwargs):
        raise ApiException('Invalid Action', status=400)

    def rename(self, *args, **kwargs):
        raise ApiException('Invalid Action', status=400)

    def share(self, *args, **kwargs):
        raise ApiException('Invalid Action', status=400)

    def trash(self, *args, **kwargs):
        raise ApiException('Invalid Action', status=400)

    def upload(self, *args, **kwargs):
        raise ApiException('Invalid Action', status=400)

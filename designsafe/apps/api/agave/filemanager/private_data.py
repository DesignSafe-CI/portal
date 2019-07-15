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

class PrivateDataFileManager(AgaveFileManager):
    NAME = 'my_data'

    @property
    def requires_auth(self):
        """Whether it should check for an authenticated user.

        If this is a public data file manager, it should return False.
        """
        return True

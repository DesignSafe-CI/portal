from designsafe.apps.api.exceptions import ApiException
from django.conf import settings
import urllib
import os
import logging
logger = logging.getLogger(__name__)

class FileManager(object):
    def __init__(self, user_obj, **kwargs):
        pass

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
        pass

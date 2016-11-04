"""Main views for box. api/external-resources/*"""

import logging
import json
import os
from django.http import JsonResponse, HttpResponseBadRequest
from designsafe.apps.api.views import BaseApiView
from designsafe.apps.api.mixins import SecureMixin
from designsafe.apps.api.external_resources.box.filemanager.manager \
    import FileManager as BoxFileManager

logger = logging.getLogger(__name__)

class FilesListView(BaseApiView, SecureMixin):
    """Listing view"""

    def get(self, request, file_mgr_name, file_id=None):
        if file_mgr_name != BoxFileManager.NAME:
            return HttpResponseBadRequest('Incorrect file manager.')

        fmgr = BoxFileManager(request.user)
        listing = fmgr.listing(file_id)
        return JsonResponse(listing)

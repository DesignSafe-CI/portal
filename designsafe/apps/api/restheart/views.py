""" Main views for mongodb """

import logging
import json
# from designsafe.apps.api.restheart.utils import mongo_client
# replace mongo_client with agavepy client
from designsafe.apps.api.restheart.manager.metamanager import FileMetaManager
from django.http import JsonResponse
from django.http import HttpResponseBadRequest, HttpResponseForbidden
from django.views.generic.base import View
from requests import HTTPError


logger = logging.getLogger(__name__)

class RestHeartFileMetaView(View):

    def get(self, request, system_id, file_path):
        """
        BOOKMARK:
        The file path param is missing the first /... This might be fixable in the urls section.
        This is causing an issue with getting the file based on the system and path...
        """
        # designsafe.storage.default
        # keiths/image.png
        # col_meta = fmm.get_all_test()
        fmm = FileMetaManager()
        col_meta = fmm.get_file_doc(system_id=system_id, file_path=file_path)
        if col_meta:
            return JsonResponse({'col_meta': col_meta})
        else:
            logger.exception('Error: failed to query meta document for file: {p} in system : {s}'.format(p=file_path, s=system_id))
            return JsonResponse({'error':'Error: failed to query meta document for: {p}'.format(p=file_path)})

    def post(self, request, system_id, file_path):
        fmm = FileMetaManager()
        resp = fmm.create_file_doc(body=request.body, system_id=system_id, file_path=file_path)
        return JsonResponse(resp)

    # def delete(self, request, system_id, file_path):
    #     mm = FileMetaManager(collection='metadata')
    #     resp = fmm.delete_file_doc(system_id=system_id, file_path=file_path)
    #     return resp

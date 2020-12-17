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
from django.core.exceptions import ObjectDoesNotExist


logger = logging.getLogger(__name__)

class RestHeartFileMetaView(View):

    def get(self, request, system_id, file_path):
        fmm = FileMetaManager()
        col_meta = fmm.get_file_doc(system_id=system_id, file_path=file_path)
        if type(col_meta) is dict:
            return JsonResponse(col_meta)
        else:
            logger.exception('Error: failed to query meta document for file: {p} in system : {s}'.format(p=file_path, s=system_id))
            return JsonResponse({'error':'Error: failed to query meta document for: {p}'.format(p=file_path)})
        # except ObjectDoesNotExist as e:
        #     logger.exception(e)
        #     return JsonResponse(e)

    def post(self, request, system_id, file_path):
        fmm = FileMetaManager()
        resp = fmm.create_file_doc(body=request.body, system_id=system_id, file_path=file_path)
        return JsonResponse(resp)

    def delete(self, request, doc_id):
        logger.info('DOC_ID =====> {}'.format(doc_id))
        fmm = FileMetaManager()
        resp = fmm.delete_file_doc(doc_id=doc_id)
        return resp

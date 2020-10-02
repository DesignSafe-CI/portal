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
        logger.info('FILE PATH ===> %s', file_path)
        logger.info('SYSTEM ID ===> %s', system_id)
        logger.info('REQUEST =====> %s', request)
        mm = FileMetaManager()
        col_meta = mm.get_all_test()

        if col_meta:
            return JsonResponse({'col_meta': col_meta})
        else:
            logger.exception('Error: failed to query meta document for file: {p} in system : {s}'.format(p=file_path, s=system_id))
            return JsonResponse({'error':'Error: failed to query meta document for: {p}'.format(p=file_path)})

    # def get(self, request, system_id, file_path):
    #     mm = FileMetaManager(collection='metadata')
    #     file_meta = mm.get_file_doc(system_id=system_id, file_path=file_path)

    #     if file_meta:
    #         return JsonResponse({'file_meta': file_meta})
    #     else:
    #         logger.exception('Error: failed to query meta document for file: {p} in system : {s}'.format(p=file_path, s=system_id))
    #         return JsonResponse({'error':'Error: failed to query meta document for: {p}'.format(p=file_path)})

    # def post(self, request, system_id, file_path):
    #     mm = FileMetaManager(collection='metadata')
    #     resp = mm.create_file_doc(body=json.loads(request.body), system_id=system_id, file_path=file_path)
    #     return resp

    # def delete(self, request, system_id, file_path):
    #     mm = FileMetaManager(collection='metadata')
    #     resp = mm.delete_file_doc(system_id=system_id, file_path=file_path)
    #     return resp

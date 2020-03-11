""" Main views for mongodb """

import logging
import json
from designsafe.apps.api.mongodb.utils import mongo_client
from designsafe.apps.api.mongodb.manager.metamanager import MongoMetaManager
from django.http import JsonResponse
from django.http import HttpResponseBadRequest, HttpResponseForbidden
from django.views.generic.base import View
from requests import HTTPError


logger = logging.getLogger(__name__)

class MongoMetaView(View):

    def get(self, request, system_id, file_path):
        mm = MongoMetaManager(collection='metadata')
        file_meta = mm.get_file_doc(system_id=system_id, file_path=file_path)

        if file_meta:
            return JsonResponse({'file_meta': file_meta})
        else:
            logger.exception('Error: failed to query meta document for file: {p} in system : {s}'.format(p=file_path, s=system_id))
            return JsonResponse({'error':'Error: failed to query meta document for: {p}'.format(p=file_path)})

    def post(self, request, system_id, file_path):
        mm = MongoMetaManager(collection='metadata')
        resp = mm.create_file_doc(body=json.loads(request.body), system_id=system_id, file_path=file_path)
        return resp

    def delete(self, request, system_id, file_path):
        mm = MongoMetaManager(collection='metadata')
        resp = mm.delete_file_doc(system_id=system_id, file_path=file_path)
        return resp

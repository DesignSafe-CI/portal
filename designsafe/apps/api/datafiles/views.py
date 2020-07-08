from designsafe.apps.api.views import BaseApiView
from django.http import JsonResponse, HttpResponseForbidden
from django.conf import settings
from requests.exceptions import HTTPError
import json
import logging
from designsafe.apps.api.datafiles.handlers.agave_handlers import agave_get_handler, agave_put_handler, agave_post_handler
from designsafe.apps.api.datafiles.handlers.googledrive_handlers import googledrive_get_handler
from designsafe.apps.api.datafiles.operations.transfer_operations import transfer, transfer_folder
# Create your views here.

logger = logging.getLogger(__name__)

class AgaveFilesView(BaseApiView):
    def get(self, request, operation=None, scheme='private', system=None, path='/'):
        try:
            client = request.user.agave_oauth.client
        except AttributeError:
            client = None
        try:
            response = agave_get_handler(
                client, scheme, system, path, operation, **request.GET.dict())
            return JsonResponse(response)
        except HTTPError as e:
            return JsonResponse({'message': str(e)}, status=e.response.status_code)

    def put(self, request, operation=None, scheme='private',
            handler=None, system=None, path='/'):

        body = json.loads(request.body)
        try:
            client = request.user.agave_oauth.client
        except AttributeError:
            return HttpResponseForbidden

        response = agave_put_handler(client, scheme, system, path, operation, body=body)

        return JsonResponse(response)

    def post(self, request, operation=None, scheme='private',
             handler=None, system=None, path='/'):
        body = request.FILES.dict()
        try:
            client = request.user.agave_oauth.client
        except AttributeError:
            return HttpResponseForbidden()

        response = agave_post_handler(client, scheme, system, path, operation, body=body)

        return JsonResponse(response)


class GoogledriveFilesView(BaseApiView):
    def get(self, request, operation=None, scheme='private', system=None, path='root'):
        try:
            client = request.user.googledrive_user_token.client
        except AttributeError:
            client = None

        try:
            response = googledrive_get_handler(
                client, scheme, system, path, operation, **request.GET.dict())
            return JsonResponse(response)
        except HTTPError as e:
            return JsonResponse({'message': str(e)}, status=e.response.status_code)


class TransferFilesView(BaseApiView):
    def put(self, request, format):
        client_lookup = {
            'agave': request.user.agave_oauth.client,
            'googledrive': request.user.googledrive_user_token.client
        }
        body = json.loads(request.body)
        src_client = client_lookup[body['src_api']]
        dest_client = client_lookup[body['dest_api']]

        if format == 'folder':
            resp = transfer_folder(src_client, dest_client, **body)
            return JsonResponse({'success': True})
        else:
            resp = transfer(src_client, dest_client, **body)
            return JsonResponse({'success': True})

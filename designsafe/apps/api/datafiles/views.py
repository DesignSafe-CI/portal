from designsafe.apps.api.views import BaseApiView
from django.http import JsonResponse, HttpResponseForbidden, FileResponse
from django.conf import settings
from django.contrib.auth import get_user_model
from requests.exceptions import HTTPError
import json
import logging
from designsafe.apps.api.datafiles.handlers.agave_handlers import agave_get_handler, agave_put_handler, agave_post_handler
from designsafe.apps.api.datafiles.handlers.shared_handlers import shared_get_handler, shared_put_handler
from designsafe.apps.api.datafiles.handlers.googledrive_handlers import googledrive_get_handler, googledrive_put_handler
from designsafe.apps.api.datafiles.handlers.dropbox_handlers import dropbox_get_handler, dropbox_put_handler
from designsafe.apps.api.datafiles.handlers.box_handlers import box_get_handler, box_put_handler
from designsafe.apps.api.datafiles.operations.transfer_operations import transfer, transfer_folder
# Create your views here.

logger = logging.getLogger(__name__)

class AgaveFilesView(BaseApiView):
    def get(self, request, operation=None, scheme='private', system=None, path='/'):
        if not request.user.is_authenticated:
            client = get_user_model().objects.get(username='envision').agave_oauth.client
        else:
            client = request.user.agave_oauth.client
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

        try:
            response = agave_put_handler(request.user.username, client, scheme, system, path, operation, body=body)
        except HTTPError as e:
            return JsonResponse({'message': str(e)}, status=e.response.status_code)

        return JsonResponse(response)

    def post(self, request, operation=None, scheme='private',
             handler=None, system=None, path='/'):
        post_files = request.FILES.dict()
        post_body = request.POST.dict()

        try:
            client = request.user.agave_oauth.client
        except AttributeError:
            return HttpResponseForbidden()

        response = agave_post_handler(request.user.username, client, scheme, system, path, operation, body={**post_files, **post_body})

        return JsonResponse(response)


class SharedFilesView(BaseApiView):
    def get(self, request, operation=None, scheme='private', system=None, path=''):
        try:
            client = request.user.agave_oauth.client
        except AttributeError:
            client = None
        username = request.user.username
        try:
            response = shared_get_handler (
                client, scheme, system, path, username, operation, **request.GET.dict())
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

        response = shared_put_handler(client, scheme, system, path, operation, body=body)

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

    def put(self, request, operation=None, scheme='private',
            handler=None, system=None, path=''):

        body = json.loads(request.body)
        try:
            client = request.user.googledrive_user_token.client
        except AttributeError:
            return HttpResponseForbidden

        response = googledrive_put_handler(client, scheme, system, path, operation, body=body)

        return JsonResponse(response)
class DropboxFilesView(BaseApiView):
    def get(self, request, operation=None, scheme='private', system=None, path=''):
        try:
            client = request.user.dropbox_user_token.client
        except AttributeError:
            client = None

        try:
            response = dropbox_get_handler(
                client, scheme, system, path, operation, **request.GET.dict())
            return JsonResponse(response)
        except HTTPError as e:
            return JsonResponse({'message': str(e)}, status=e.response.status_code)

    def put(self, request, operation=None, scheme='private',
            handler=None, system=None, path=''):

        body = json.loads(request.body)
        try:
            client = request.user.dropbox_user_token.client
        except AttributeError:
            return HttpResponseForbidden

        response = dropbox_put_handler(client, scheme, system, path, operation, body=body)

        return JsonResponse(response)

    

class BoxFilesView(BaseApiView):
    def get(self, request, operation=None, scheme='private', system=None, path=''):
        try:
            client = request.user.box_user_token.client
        except AttributeError:
            client = None

        try:
            response = box_get_handler(
                client, scheme, system, path, operation, **request.GET.dict())
            return JsonResponse(response)
        except HTTPError as e:
            return JsonResponse({'message': str(e)}, status=e.response.status_code)
    def put(self, request, operation=None, scheme='private',
            handler=None, system=None, path=''):

        body = json.loads(request.body)
        try:
            client = request.user.box_user_token.client
        except AttributeError:
            return HttpResponseForbidden

        response = box_put_handler(client, scheme, system, path, operation, body=body)

        return JsonResponse(response)


class TransferFilesView(BaseApiView):
    def put(self, request, format):
        client_lookup = {
            'agave': request.user.agave_oauth.client,
            'googledrive': request.user.googledrive_user_token.client,
            'dropbox': request.user.dropbox_user_token.client,
            'box': request.user.box_user_token.client
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

class FileMediaView(BaseApiView):
    def get(self, request, api, scheme, system, path):

        from designsafe.apps.api.datafiles.operations.googledrive_operations import download
        client = request.user.googledrive_user_token.client
        resp = download(client, system, path)

        # return JsonResponse({'name': resp.name})

        return FileResponse(resp)

import logging
from django.conf import settings
from django.http import (Http404, HttpResponseBadRequest, HttpResponseForbidden,
                         HttpResponseServerError)
from django.views.generic.base import View
from django.http import JsonResponse
from .filemanager.agave import AgaveFileManager
from .filemanager.search_index import ElasticFileManager
from designsafe.apps.api.agave.models.util import AgaveJSONEncoder
from requests import HTTPError


logger = logging.getLogger(__name__)


class FileManagersView(View):

    def get(self, request, file_mgr_name=None):
        if file_mgr_name is not None:
            return JsonResponse({'file_mgr_name': file_mgr_name})
        else:
            return JsonResponse([
                'agave',
                'box',
                'public',
            ], safe=False)


class FileListingView(View):

    @staticmethod
    def default_listing_file_id(user):
        # TODO this should be in the AgaveFileManager
        return '/'.join([settings.AGAVE_STORAGE_SYSTEM, user.username])

    def get(self, request, file_mgr_name, system_id=None, file_path=None):

        if file_mgr_name == AgaveFileManager.NAME:
            fm = AgaveFileManager(agave_client=request.user.agave_oauth.client)
            if system_id is None:
                system_id = AgaveFileManager.DEFAULT_SYSTEM_ID
            if file_path is None:
                file_path = request.user.username

            if file_path.strip('/') == '$SHARE':
                listing = ElasticFileManager.listing(system=system_id,
                                                     file_path='/',
                                                     user_context=request.user.username)
                return JsonResponse(listing)
            else:
                try:
                    listing = fm.listing(system=system_id, file_path=file_path)
                    return JsonResponse(listing, encoder=AgaveJSONEncoder, safe=False)
                except HTTPError as e:
                    if e.response.status_code == 403:
                        return HttpResponseForbidden(e.response.text)
                    elif e.response.status_code >= 500:
                        return HttpResponseServerError(e.response.text)
                    elif e.response.status_code >= 400:
                        return HttpResponseBadRequest(e.response.text)


        raise Http404()


class FileMediaView(View):
    pass


class FileSearchView(View):
    pass


class FilePermissionsView(View):
    pass

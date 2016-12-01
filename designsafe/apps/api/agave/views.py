""" Main views for agave api. api/agave/* 
    All these views return :class:`JsonResponse`s"""

import logging
import json
import os
import chardet
from django.core.urlresolvers import reverse
from django.http import (HttpResponseRedirect, HttpResponseBadRequest,
                         HttpResponseForbidden, HttpResponseServerError)
from django.shortcuts import render
from django.views.generic.base import View
from django.http import JsonResponse
from designsafe.apps.api.agave.filemanager.agave import AgaveFileManager
from designsafe.apps.api.agave.filemanager.search_index import ElasticFileManager
from designsafe.apps.api.agave import get_service_account_client
from designsafe.apps.api.agave.models.util import AgaveJSONEncoder
from designsafe.apps.api.agave.models.files import BaseFileResource
from designsafe.apps.api.agave.models.systems import BaseSystemResource
from requests import HTTPError


logger = logging.getLogger(__name__)


class FileManagersView(View):
    """Main view for File Managers. Used to get current available file managers."""

    def get(self, request, file_mgr_name=None):
        """Overwrite get. Fired on GET HTTP verb"""

        if file_mgr_name is not None:
            return JsonResponse({'file_mgr_name': file_mgr_name})
        else:
            return JsonResponse([
                'agave',
                'box',
                'public',
            ], safe=False)

class FileListingView(View):
    """Main File Listing View. Used to list agave resources."""

    def get(self, request, file_mgr_name, system_id=None, file_path=None):
        if file_mgr_name == AgaveFileManager.NAME:
            if not request.user.is_authenticated():
                return HttpResponseForbidden('Log in required')

            fm = AgaveFileManager(agave_client=request.user.agave_oauth.client)
            if system_id is None:
                system_id = AgaveFileManager.DEFAULT_SYSTEM_ID
            if file_path is None:
                file_path = request.user.username
            
            if system_id == AgaveFileManager.DEFAULT_SYSTEM_ID and \
                (file_path.strip('/') == '$SHARE' or
                 file_path.strip('/').split('/')[0] != request.user.username):

                listing = ElasticFileManager.listing(system=system_id,
                                                     file_path=file_path,
                                                     user_context=request.user.username)
                return JsonResponse(listing)
            else:
                try:
                    offset = int(request.GET.get('offset', 0))
                    limit = int(request.GET.get('limit', 100))
                    listing = fm.listing(system=system_id, file_path=file_path,
                                         offset=offset, limit=limit)
                    return JsonResponse(listing, encoder=AgaveJSONEncoder, safe=False)
                except HTTPError as e:
                    logger.exception('Unable to list files')
                    if e.response.status_code == 403:
                        return HttpResponseForbidden(e.response.text)
                    elif e.response.status_code >= 500:
                        return HttpResponseServerError(e.response.text)
                    elif e.response.status_code >= 400:
                        return HttpResponseBadRequest(e.response.text)

        return HttpResponseBadRequest()


class FileMediaView(View):

    def get(self, request, file_mgr_name, system_id, file_path):
        if file_mgr_name == AgaveFileManager.NAME \
            or file_mgr_name == 'public':
            if not request.user.is_authenticated():
                return HttpResponseForbidden('Log in required')

            fm = AgaveFileManager(agave_client=request.user.agave_oauth.client)
            f = fm.listing(system_id, file_path)
            if request.GET.get('preview', False):
                context = {
                    'file': f
                }
                if f.ext in BaseFileResource.SUPPORTED_IMAGE_PREVIEW_EXTS:
                    context['image_preview'] = f.download_postit(force=False, lifetime=360)
                elif f.ext in BaseFileResource.SUPPORTED_TEXT_PREVIEW_EXTS:
                    content = f.download()
                    try:
                        encoded = content.encode('utf-8')
                    except UnicodeError:
                        try:
                            encoding = chardet.detect(content)['encoding']
                            encoded = content.decode(encoding).encode('utf-8')
                        except UnicodeError:
                            logger.exception('Failed to preview file',
                                             extra={'file_mgr_name': file_mgr_name,
                                                    'system_id': system_id,
                                                    'file_path': file_path})
                            encoded = u'Sorry! We were unable to preview this file due ' \
                                      u'to a unrecognized content encoding. Please ' \
                                      u'download the file to view its contents.'
                    context['text_preview'] = encoded
                elif f.ext in BaseFileResource.SUPPORTED_OBJECT_PREVIEW_EXTS:
                    context['object_preview'] = f.download_postit(force=False, lifetime=360)

                return render(request, 'designsafe/apps/api/agave/preview.html', context)
            else:
                return HttpResponseRedirect(fm.download(system_id, file_path))

        return HttpResponseBadRequest("Unsupported operation")

    def post(self, request, file_mgr_name, system_id, file_path):
        if file_mgr_name == AgaveFileManager.NAME \
            or file_mgr_name == 'public':
            if not request.user.is_authenticated():
                return HttpResponseForbidden('Log in required')

            agave_client = request.user.agave_oauth.client
            fm = AgaveFileManager(agave_client=agave_client)
            if request.FILES:
                upload_file = request.FILES['file']
                upload_dir = file_path

                relative_path = request.POST.get('relative_path', None)
                if relative_path:
                    # user uploaded a folder structure; ensure path exists
                    upload_dir = os.path.join(file_path, os.path.dirname(relative_path))
                    BaseFileResource.ensure_path(agave_client, system_id, upload_dir)

                try:
                    result = fm.upload(system_id, upload_dir, upload_file)
                except HTTPError as e:
                    logger.error(e.response.text)
                    return HttpResponseBadRequest(e.response.text)

            return JsonResponse({'status': 'ok'})

        return HttpResponseBadRequest("Unsupported operation")

    def put(self, request, file_mgr_name, system_id, file_path):
        if request.is_ajax():
            body = json.loads(request.body)
        else:
            body = request.POST.copy()

        if file_mgr_name == AgaveFileManager.NAME \
            or file_mgr_name == 'public':
            if not request.user.is_authenticated():
                return HttpResponseForbidden('Log in required')

            fm = AgaveFileManager(agave_client=request.user.agave_oauth.client)
            action = body.get('action', '')
            if action == 'copy':
                try:
                    if body.get('system') != system_id:
                        copied = fm.import_data(body.get('system'), body.get('path'),
                                                system_id, file_path)
                    else:
                        copied = fm.copy(system_id, file_path, body.get('path'), body.get('name'))
                    return JsonResponse(copied, encoder=AgaveJSONEncoder, safe=False)
                except HTTPError as e:
                    logger.exception(e.response.text)
                    return HttpResponseBadRequest(e.response.text)

            elif action == 'download':
                return JsonResponse({
                    'href': fm.download(system_id, file_path)
                })

            elif action == 'mkdir':
                try:
                    new_dir = fm.mkdir(system_id, file_path, body.get('name'))
                    return JsonResponse(new_dir, encoder=AgaveJSONEncoder, safe=False)
                except HTTPError as e:
                    logger.exception(e.response.text)
                    return HttpResponseBadRequest(e.response.text)

            elif action == 'move':
                try:
                    if body.get('system') != system_id:
                        moved = fm.import_data(body.get('system'), body.get('path'), system_id, file_path)
                        fm.delete(system_id, file_path)
                    else:
                        moved = fm.move(system_id, file_path, body.get('path'), body.get('name'))
                    return JsonResponse(moved, encoder=AgaveJSONEncoder, safe=False)
                except HTTPError as e:
                    logger.exception(e.response.text)
                    return HttpResponseBadRequest(e.response.text)

            elif action == 'preview':
                try:
                    file_listing = fm.listing(system_id, file_path)
                    if file_listing.previewable:
                        preview_url = reverse('designsafe_api:files_media',
                                              args=[file_mgr_name, system_id, file_path])
                        return JsonResponse({'href': '{}?preview=true'.format(preview_url)})
                    else:
                        return HttpResponseBadRequest('Preview not available for this item')
                except HTTPError as e:
                    logger.exception('Unable to preview file')
                    return HttpResponseBadRequest(e.response.text)

            elif action == 'rename':
                try:
                    renamed = fm.rename(system_id, file_path, body.get('name'))
                    return JsonResponse(renamed, encoder=AgaveJSONEncoder, safe=False)
                except HTTPError as e:
                    logger.exception(e.response.text)
                    return HttpResponseBadRequest(e.response.text)

            elif action == 'trash':
                trash_path = request.user.username + '/.Trash'

                try:
                    trashed = fm.trash(system_id, file_path, trash_path)
                    return JsonResponse(trashed, encoder=AgaveJSONEncoder, safe=False)
                except HTTPError as e:
                    logger.error(e.response.text)
                    return HttpResponseBadRequest(e.response.text)

        return HttpResponseBadRequest("Unsupported operation")

    def delete(self, request, file_mgr_name, system_id, file_path):
        if file_mgr_name == AgaveFileManager.NAME:
            if not request.user.is_authenticated():
                return HttpResponseForbidden('Log in required')

            fm = AgaveFileManager(agave_client=request.user.agave_oauth.client)
            try:
                fm.delete(system_id, file_path)
                return JsonResponse({'status': 'ok'})
            except HTTPError as e:
                logger.exception(e.response.text)
                return HttpResponseBadRequest(e.response.text)

        return HttpResponseBadRequest("Unsupported operation")


class FileSearchView(View):
    """ File Search View"""
    def get(self, request, file_mgr_name, system_id = None, file_path = None):
        """ GET handler """
        offset = int(request.GET.get('offset', 0))
        limit = int(request.GET.get('limit', 100))
        query_string = request.GET.get('query_string')

        if file_mgr_name != ElasticFileManager.NAME or not query_string:
            return HttpResponseBadRequest()
        
        if system_id is None:
            system_id = ElasticFileManager.DEFAULT_SYSTEM_ID

        fmgr = ElasticFileManager()
        if not request.GET.get('shared', False):
            listing = fmgr.search(system_id, request.user.username, query_string,
                                  offset=offset, limit=limit)
        else:
            listing = fmgr.search_shared(system_id, request.user.username, query_string,
                                         offset=offset, limit=limit)

        return JsonResponse(listing)

class FilePermissionsView(View):

    def get(self, request, file_mgr_name, system_id, file_path):
        if file_mgr_name == AgaveFileManager.NAME \
            or file_mgr_name == 'public':
            if not request.user.is_authenticated():
                return HttpResponseForbidden('Log in required')

            # List permissions as the portal user rather than logged in user.
            # This also works around the issue where pems on private systems are
            # inconsistent.
            fm = AgaveFileManager(agave_client=get_service_account_client())
            pems = fm.list_permissions(system_id, file_path)
            return JsonResponse(pems, encoder=AgaveJSONEncoder, safe=False)

        return HttpResponseBadRequest("Unsupported operation")

    def post(self, request, file_mgr_name, system_id, file_path):
        if request.is_ajax():
            body = json.loads(request.body)
        else:
            body = request.POST.copy()

        if file_mgr_name == AgaveFileManager.NAME \
            or file_mgr_name == 'public':
            if not request.user.is_authenticated():
                return HttpResponseForbidden('Log in required')

            fm = AgaveFileManager(agave_client=request.user.agave_oauth.client)
            username = body.get('username')
            permission = body.get('permission')

            pem = fm.share(system_id, file_path, username, permission)
            return JsonResponse(pem, encoder=AgaveJSONEncoder, safe=False)

        return HttpResponseBadRequest("Unsupported operation")

class FileMetaView(View):
    def get(self, request, file_mgr_name, system_id, file_path):
        if file_mgr_name == ElasticFileManager.NAME:
            if not request.user.is_authenticated():
                return HttpResponseForbidden('Log in required')

            fmgr = AgaveFileManager(agave_client=request.user.agave_oauth.client)
            file_obj = fmgr.listing(system_id, file_path)
            file_dict = file_obj.to_dict()
            file_dict['keywords'] = file_obj.metadata.value['keywords']
            return JsonResponse(file_dict)
        
        return HttpResponseBadRequest('Unsupported file manager.')

    def put(self, request, file_mgr_name, system_id, file_path):
        post_body = json.loads(request.body)
        metadata = post_body.get('metadata', {})
        logger.debug('metadata: %s' % (metadata, ))
        if file_mgr_name == ElasticFileManager.NAME or not metadata:
            if not request.user.is_authenticated():
                return HttpResponseForbidden('Log in required')

            fmgr = AgaveFileManager(agave_client=request.user.agave_oauth.client)
            file_obj = fmgr.listing(system_id, file_path)
            file_obj.metadata.update(metadata)
            file_dict = file_obj.to_dict()
            file_dict['keyword'] = file_obj.metadata.value['keywords']
            return JsonResponse(file_dict)
        
        return HttpResponseBadRequest('Unsupported file manager.')

class SystemsView(View):

    def get(self, request, system_id=None):
        params = request.GET.copy()
        if request.user.is_authenticated():
            ag = request.user.agave_oauth.client
            if system_id is None:
                systems = BaseSystemResource.list(ag, **params)
                return JsonResponse(systems, encoder=AgaveJSONEncoder, safe=False)
            else:
                system = BaseSystemResource.from_id(ag, system_id)
                return JsonResponse(system, encoder=AgaveJSONEncoder, safe=False)
        else:
            # Force public=true
            params.pop('public', None)
            ag = get_service_account_client()
            systems = BaseSystemResource.list(ag, public=True, **params)
            return JsonResponse(systems, encoder=AgaveJSONEncoder, safe=False)

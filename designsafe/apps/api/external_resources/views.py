"""Main views for box. api/external-resources/*"""

import logging
import json
import os
from requests import HTTPError
from requests import HTTPError
from requests import HTTPError
from requests import HTTPError
from django.http import (JsonResponse, HttpResponseBadRequest,
                         HttpResponseRedirect)
from django.shortcuts import render
from django.core.urlresolvers import reverse
from designsafe.apps.api.views import BaseApiView
from designsafe.apps.api.mixins import SecureMixin
from designsafe.apps.api.external_resources.box.filemanager.manager \
    import FileManager as BoxFileManager
from designsafe.apps.api.external_resources.dropbox.filemanager.manager \
    import FileManager as DropboxFileManager
from designsafe.apps.api.external_resources.box.models.files import BoxFile
from designsafe.apps.api import tasks

logger = logging.getLogger(__name__)

class FilesListView(BaseApiView, SecureMixin):
    """Listing view"""

    def get(self, request, file_mgr_name, file_id=None):
        if file_mgr_name not in [BoxFileManager.NAME, DropboxFileManager.NAME]:
            return HttpResponseBadRequest('Incorrect file manager.')

        if file_mgr_name == 'box':
            fmgr = BoxFileManager(request.user)
        elif file_mgr_name == 'dropbox':
            fmgr = DropboxFileManager(request.user)

        listing = fmgr.listing(file_id)
        return JsonResponse(listing, safe=False)

class FileMediaView(BaseApiView, SecureMixin):
    """File Media View"""

    def get(self, request, file_mgr_name, file_id):
        if file_mgr_name not in [BoxFileManager.NAME, DropboxFileManager.NAME]:
            return HttpResponseBadRequest("Incorrect file manager.")

        if file_mgr_name == 'box':
            fmgr = BoxFileManager(request.user)
        elif file_mgr_name == 'dropbox':
            fmgr = DropboxFileManager(request.user)

        f = fmgr.listing(file_id)
        if request.GET.get('preview', False):
            context = {
                'file': f
            }
            preview_url = fmgr.preview(file_id)
            if preview_url is not None:
                context['preview_url'] = preview_url['href']
            return render(request, 'designsafe/apps/api/box/preview.html',
                          context)
        else:
            return HttpResponseRedirect(fmgr.download(file_id))

    def put(self, request, file_mgr_name, file_id):
        if request.is_ajax():
            body = json.loads(request.body)
        else:
            body = request.POST.copy()

        action = body.get('action')

        if file_mgr_name not in [BoxFileManager.NAME, DropboxFileManager.NAME] or action is None:
            return HttpResponseBadRequest("Bad Request.")

        if file_mgr_name == 'box':
            fmgr = BoxFileManager(request.user)
        elif file_mgr_name == 'dropbox':
            fmgr = DropboxFileManager(request.user)

        if action == 'preview':
            try:
                box_file_type, box_file_id = fmgr.parse_file_id(file_id)
                box_op = getattr(fmgr.box_api, box_file_type)
                box_file = BoxFile(box_op(box_file_id).get())
                if box_file.previewable:
                    preview_url = reverse('designsafe_api:box_files_media',
                                          args=[file_mgr_name, file_id.strip('/')])
                    return JsonResponse({'href':
                                           '{}?preview=true'.format(preview_url)})
                else:
                    return HttpResponseBadRequest('Preview not available for this item.')
            except HTTPError as e:
                logger.exception('Unable to preview file')
                return HttpResponseBadRequest(e.response.text)

        elif action == 'copy' or action == 'move':
            try:
                tasks.box_resource_download.apply_async(kwargs={
                    'username': request.user.username,
                    'src_file_id': file_id,
                    'dest_file_id': os.path.join(body['system'], body['path'].strip('/'))})
                return JsonResponse({'status': 200, 'message': 'OK'})
            except HTTPError as e:
                logger.exception('Unable to copy file')
                return HttpResponseBadRequest(e.response.text)

        elif action == 'download':
            try:
                download_dict = fmgr.download(file_id)
                if not download_dict:
                    HttpResponseBadRequest('Operation not permitted')

                return JsonResponse(download_dict)
            except HTTPError as err:
                logger.exception('Unable to download box file')
                return HttpResponseBadRequest(err.response.text)

        return HttpResponseBadRequest("Operation not implemented.")

class FilePermissionsView(BaseApiView, SecureMixin):
    """File Permissions View"""
    pass

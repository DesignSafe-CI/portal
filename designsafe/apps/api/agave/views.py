""" Main views for agave api. api/agave/*
    All these views return :class:`JsonResponse`s"""

import logging
import json
import os
import re
import chardet
from django.core.urlresolvers import reverse
from django.http import (HttpResponseRedirect, HttpResponseBadRequest,
                         HttpResponseForbidden, HttpResponseServerError)
from django.shortcuts import render
from django.views.generic.base import View
from django.http import JsonResponse
from django.contrib.auth import get_user_model
from designsafe.apps.api.agave.filemanager.agave import AgaveFileManager
from designsafe.apps.api.agave.filemanager.search_index import ElasticFileManager
from designsafe.apps.api.agave import get_service_account_client
from designsafe.apps.data.models.agave.util import AgaveJSONEncoder
from designsafe.apps.data.models.agave.files import BaseFileResource
from designsafe.apps.data.models.agave.systems import BaseSystemResource
from designsafe.apps.api.notifications.models import Notification
from designsafe.apps.api.tasks import external_resource_upload
from designsafe.apps.api.views import BaseApiView
from designsafe.libs.common.decorators import profile as profile_fn
from requests import HTTPError


logger = logging.getLogger(__name__)
metrics = logging.getLogger('metrics')


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

class FileListingView(BaseApiView):
    """Main File Listing View. Used to list agave resources."""

    @profile_fn
    def get(self, request, file_mgr_name, system_id=None, file_path=None):
        if file_mgr_name == AgaveFileManager.NAME:
            if not request.user.is_authenticated:
                return HttpResponseForbidden('Login required')

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
                offset = int(request.GET.get('offset', 0))
                limit = int(request.GET.get('limit', 100))
                listing = fm.listing(system=system_id, file_path=file_path,
                                     offset=offset, limit=limit)
                return JsonResponse(listing,
                                    encoder=AgaveJSONEncoder,
                                    safe=False)
        return HttpResponseBadRequest()


class FileMediaView(View):

    @profile_fn
    def get(self, request, file_mgr_name, system_id, file_path):
        if file_mgr_name == AgaveFileManager.NAME \
            or file_mgr_name == 'public' \
            or file_mgr_name == 'community' \
            or file_mgr_name == 'published':
            if not request.user.is_authenticated:
                if file_mgr_name in ['public', 'community', 'published']:
                    ag = get_user_model().objects.get(username='envision').agave_oauth.client
                else:
                    return HttpResponseForbidden('Login required')
            else:
                ag = request.user.agave_oauth.client

            fm = AgaveFileManager(agave_client=ag)
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
                                      u'to an unrecognized content encoding. Please ' \
                                      u'download the file to view its contents.'
                    context['text_preview'] = encoded
                elif f.ext in BaseFileResource.SUPPORTED_OBJECT_PREVIEW_EXTS:
                    context['object_preview'] = f.download_postit(force=False, lifetime=360)

                elif f.ext in BaseFileResource.SUPPORTED_MS_OFFICE:
                    context['iframe_preview'] = 'https://view.officeapps.live.com/op/view.aspx?src={}'\
                                                .format(f.download_postit(force=False, lifetime=360))
                elif f.ext in BaseFileResource.SUPPORTED_VIDEO_EXTS:
                    context['video_preview'] = f.download_postit(force=False, lifetime=360)
                    context['mimetype'] = BaseFileResource.SUPPORTED_VIDEO_MIMETYPES[f.ext]

                return render(request, 'designsafe/apps/api/agave/preview.html', context)
            else:
                url = 'https://agave.designsafe-ci.org/files/v2/media/{system}/{path}'.format(system=system_id, path=file_path)
                # return HttpResponseRedirect(fm.download(system_id, file_path))
                resp = HttpResponseRedirect(url)
                resp['X-Authorization'] = 'Bearer {token}'.format(token=request.user.agave_oauth.access_token)
                logger.info(resp)
                return resp

        return HttpResponseBadRequest("Unsupported operation")

    @profile_fn
    def post(self, request, file_mgr_name, system_id, file_path):
        if file_mgr_name == AgaveFileManager.NAME \
            or file_mgr_name == 'public':
            if not request.user.is_authenticated:
                return HttpResponseForbidden('Login required')

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
                    metrics.info('Data Depot',
                                 extra = {
                                     'user': request.user.username,
                                     'sessionId': getattr(request.session, 'session_key', ''),
                                     'operation': 'data_depot_folder_upload',
                                     'info': {
                                         'filePath': file_path,
                                         'relativePath': os.path.dirname(relative_path),
                                         'systemId': system_id,
                                         'uploadDir': upload_dir}
                                 })
                try:
                    result = fm.upload(system_id, upload_dir, upload_file)
                    metrics.info('Data Depot',
                                 extra = {
                                     'user': request.user.username,
                                     'sessionId': getattr(request.session, 'session_key', ''),
                                     'operation': 'data_depot_file_upload',
                                     'info': {
                                         'systemId': system_id,
                                         'uploadDir': upload_dir,
                                         'uploadFile': upload_file}
                                 })
                    result['system'] = result['systemId']
                    result_file = BaseFileResource(agave_client, **result)
                    event_data = {
                        Notification.EVENT_TYPE: 'data_depot',
                        Notification.OPERATION: 'data_depot_file_upload',
                        Notification.STATUS: Notification.SUCCESS,
                        Notification.USER: request.user.username,
                        Notification.MESSAGE: 'File Upload was successful.',
                        Notification.EXTRA: result_file.to_dict()
                    }
                    Notification.objects.create(**event_data)
                except HTTPError as e:
                    logger.error(e.response.text)
                    event_data = {
                        Notification.EVENT_TYPE: 'data_depot',
                        Notification.OPERATION: 'data_depot_file_upload',
                        Notification.STATUS: Notification.ERROR,
                        Notification.USER: request.user.username,
                        Notification.MESSAGE: 'There was an error uploading one or more file(s).',
                        Notification.EXTRA: {'system': system_id, 'file_path': file_path}
                    }
                    Notification.objects.create(**event_data)
                    return HttpResponseBadRequest(e.response.text)

            return JsonResponse({'status': 'ok'})

        return HttpResponseBadRequest("Unsupported operation")

    @profile_fn
    def put(self, request, file_mgr_name, system_id, file_path):
        if request.is_ajax():
            body = json.loads(request.body)
        else:
            body = request.POST.copy()

        if file_mgr_name == AgaveFileManager.NAME \
            or file_mgr_name == 'public' \
            or file_mgr_name == 'community' \
            or file_mgr_name == 'published':

            if not request.user.is_authenticated:
                if file_mgr_name in ['public', 'community', 'published']:
                    ag = get_user_model().objects.get(username='envision').agave_oauth.client
                else:
                    return HttpResponseForbidden('Login required')
            else:
                ag = request.user.agave_oauth.client

            fm = AgaveFileManager(agave_client=ag)
            action = body.get('action', '')
            logger.info('action: %s', action)
            if action == 'copy':
                try:
                    event_data = {
                        Notification.EVENT_TYPE: 'data_depot',
                        Notification.OPERATION: 'data_depot_copy',
                        Notification.STATUS: Notification.SUCCESS,
                        Notification.USER: request.user.username,
                        Notification.MESSAGE: 'Data was copied.',
                    }
                    if body.get('system') is None:
                        external = body.get('resource')
                        if external not in ['box', 'dropbox', 'googledrive']:
                            return HttpResponseBadRequest("External resource not available.")
                        if external == 'googledrive':
                            dest_file_id = body.get('id')
                        else:
                            dest_file_id = body.get('path')
                        external_resource_upload.apply_async(kwargs={
                            'username': request.user.username,
                            'dest_resource': external,
                            'src_file_id': os.path.join(system_id, file_path.strip('/')),
                            'dest_file_id': dest_file_id
                        },
                        queue='files')
                        event_data[Notification.MESSAGE] = 'Data copy was scheduled. This may take a few minutes.'
                        event_data[Notification.EXTRA] = {
                            'resource': external,
                            'dest_file_id': body.get('path'),
                            'src_file_id': os.path.join(system_id, file_path.strip('/'))
                        }
                    elif body.get('system') != system_id:
                        copied = fm.import_data(body.get('system'), body.get('path'),
                                                system_id, file_path)
                        metrics.info('Data Depot',
                                     extra = {
                                         'user': request.user.username,
                                         'sessionId': getattr(request.session, 'session_key', ''),
                                         'operation': 'data_depot_copy',
                                         'info': {
                                             'destSystemId': body.get('system'),
                                             'destFilePath': body.get('path'),
                                             'fromSystemId': system_id,
                                             'fromFilePath': file_path}
                                     })
                        event_data[Notification.EXTRA] = copied.to_dict()
                    else:
                        copied = fm.copy(system_id, file_path, body.get('path'), body.get('name'))
                        metrics.info('Data Depot',
                                     extra = {
                                         'user': request.user.username,
                                         'sessionId': getattr(request.session, 'session_key', ''),
                                         'operation': 'data_depot_copy',
                                         'info': {
                                             'destSystemId': system_id,
                                             'destFilePath': file_path,
                                             'fromSystemId': body.get('system'),
                                             'fromFilePath': body.get('path')}
                                     })
                        event_data[Notification.EXTRA] = copied.to_dict()

                    notification = Notification.objects.create(**event_data)
                    notification.save()
                    return JsonResponse(copied, encoder=AgaveJSONEncoder, safe=False)
                except HTTPError as e:
                    logger.exception(e.response.text)
                    event_data = {
                        Notification.EVENT_TYPE: 'data_depot',
                        Notification.OPERATION: 'data_depot_copy',
                        Notification.STATUS: Notification.ERROR,
                        Notification.USER: request.user.username,
                        Notification.MESSAGE: 'There was an error copying data.',
                        Notification.EXTRA: {'message': e.response.text}
                    }
                    Notification.objects.create(**event_data)
                    return HttpResponseBadRequest(e.response.text)

            elif action == 'download':
                metrics.info('Data Depot',
                             extra = {
                                 'user': request.user.username,
                                 'sessionId': getattr(request.session, 'session_key', ''),
                                 'operation': 'agave_file_download',
                                 'info': {
                                     'systemId': system_id,
                                     'filePath': file_path}
                             })
                return JsonResponse({
                    'href': fm.download(system_id, file_path)
                })

            elif action == 'mkdir':
                try:
                    dir_name = body.get('name')
                    new_dir = fm.mkdir(system_id, file_path, dir_name)
                    metrics.info('Data Depot',
                                 extra = {
                                     'user': request.user.username,
                                     'sessionId': getattr(request.session, 'session_key', ''),
                                     'operation': 'agave_file_mkdir',
                                     'info': {
                                         'systemId': system_id,
                                         'filePath': file_path,
                                         'dirName': dir_name}
                                 })
                    event_data = {
                        Notification.EVENT_TYPE: 'data_depot',
                        Notification.OPERATION: 'data_depot_mkdir',
                        Notification.STATUS: Notification.SUCCESS,
                        Notification.USER: request.user.username,
                        Notification.MESSAGE: 'Directory created.',
                        Notification.EXTRA: new_dir.to_dict()
                    }
                    Notification.objects.create(**event_data)
                    return JsonResponse(new_dir, encoder=AgaveJSONEncoder, safe=False)
                except HTTPError as e:
                    logger.exception(e.response.text)
                    event_data = {
                        Notification.EVENT_TYPE: 'data_depot',
                        Notification.OPERATION: 'data_depot_mkdir',
                        Notification.STATUS: Notification.ERROR,
                        Notification.USER: request.user.username,
                        Notification.MESSAGE: 'Error creating directory.',
                        Notification.EXTRA: {'message': e.response.text}
                    }
                    Notification.objects.create(**event_data)
                    return HttpResponseBadRequest(e.response.text)

            elif action == 'move':
                try:
                    if body.get('system') != system_id:
                        moved = fm.import_data(body.get('system'), body.get('path'), system_id, file_path)
                        fm.delete(system_id, file_path)
                        metrics.info('Data Depot',
                                     extra = {
                                         'user': request.user.username,
                                         'sessionId': getattr(request.session, 'session_key', ''),
                                         'operation': 'agave_file_copy_move',
                                         'info': {
                                             'destSystemId': body.get('system'),
                                             'destFilePath': body.get('path'),
                                             'fromSystemId': system_id,
                                             'fromFilePath': file_path}
                                     })
                    else:
                        moved = fm.move(system_id, file_path, body.get('path'), body.get('name'))
                        metrics.info('Data Depot',
                                     extra = {
                                         'user': request.user.username,
                                         'sessionId': getattr(request.session, 'session_key', ''),
                                         'operation': 'agave_file_copy',
                                         'info': {
                                             'destSystemId': system_id,
                                             'destFilePath': file_path,
                                             'fromSystemId': body.get('system'),
                                             'fromFilePath': body.get('path')}
                                     })
                    event_data = {
                        Notification.EVENT_TYPE: 'data_depot',
                        Notification.STATUS: Notification.SUCCESS,
                        Notification.OPERATION: 'data_depot_move',
                        Notification.USER: request.user.username,
                        Notification.MESSAGE: 'Data has been moved.',
                        Notification.EXTRA: moved.to_dict()
                    }
                    Notification.objects.create(**event_data)
                    return JsonResponse(moved, encoder=AgaveJSONEncoder, safe=False)
                except HTTPError as e:
                    logger.exception(e.response.text)
                    event_data = {
                        Notification.EVENT_TYPE: 'data_depot_move',
                        Notification.STATUS: Notification.ERROR,
                        Notification.OPERATION: 'data_depot_move',
                        Notification.USER: request.user.username,
                        Notification.MESSAGE: 'There was an error moving your data.',
                        Notification.EXTRA: {'message': e.response.text}
                    }
                    Notification.objects.create(**event_data)
                    return HttpResponseBadRequest(e.response.text)

            elif action == 'preview':
                try:
                    file_listing = fm.listing(system_id, file_path)
                    if file_listing.previewable:
                        preview_url = reverse('designsafe_api:files_media',
                                              args=[file_mgr_name, system_id, file_path])
                        return JsonResponse({'href': '{}?preview=true'.format(preview_url),
                                             'postit': file_listing.download_postit(force=False, lifetime=360)})
                    else:
                        return HttpResponseBadRequest('Preview not available for this item.')
                except HTTPError as e:
                    logger.exception('Unable to preview file: {file_path}'.format(file_path=file))
                    return HttpResponseBadRequest(e.response.text)

            elif action == 'rename':
                try:
                    renamed = fm.rename(system_id, file_path, body.get('name'))
                    metrics.info('Data Depot',
                                 extra = {
                                     'user': request.user.username,
                                     'sessionId': getattr(request.session, 'session_key', ''),
                                     'operation': 'agave_file_rename',
                                     'info': {
                                         'systemId': system_id,
                                         'filePath': file_path,
                                         'name': body.get('name')}
                                 })
                    event_data = {
                        Notification.EVENT_TYPE: 'data_depot_rename',
                        Notification.STATUS: Notification.SUCCESS,
                        Notification.USER: request.user.username,
                        Notification.MESSAGE: 'File/folder was renamed.',
                        Notification.EXTRA: renamed.to_dict()
                    }
                    Notification.objects.create(**event_data)
                    return JsonResponse(renamed, encoder=AgaveJSONEncoder, safe=False)
                except HTTPError as e:
                    logger.exception(e.response.text)
                    event_data = {
                        Notification.EVENT_TYPE: 'data_depot_rename',
                        Notification.STATUS: Notification.ERROR,
                        Notification.USER: request.user.username,
                        Notification.MESSAGE: 'There was an error renaming a file/folder.',
                        Notification.EXTRA: {'message': e.response.text }
                    }
                    Notification.objects.create(**event_data)
                    return HttpResponseBadRequest(e.response.text)

            elif action == 'trash':
                trash_path = '/Trash'
                if system_id == AgaveFileManager.DEFAULT_SYSTEM_ID:
                    trash_path = request.user.username + '/.Trash'

                try:
                    trashed = fm.trash(system_id, file_path, trash_path)
                    metrics.info('Data Depot',
                                 extra = {
                                     'user': request.user.username,
                                     'sessionId': getattr(request.session, 'session_key', ''),
                                     'operation': 'agave_file_trash',
                                     'info': {
                                         'systemId': system_id,
                                         'filePath': file_path,
                                         'trashPath': trash_path}
                                 })
                    event_data = {
                        Notification.EVENT_TYPE: 'data_depot',
                        Notification.STATUS: Notification.SUCCESS,
                        Notification.OPERATION: 'data_depot_trash',
                        Notification.USER: request.user.username,
                        Notification.MESSAGE: 'File/folder was moved to trash.',
                        Notification.EXTRA: trashed.to_dict()
                    }
                    Notification.objects.create(**event_data)
                    return JsonResponse(trashed, encoder=AgaveJSONEncoder, safe=False)
                except HTTPError as e:
                    logger.error(e.response.text)
                    event_data = {
                        Notification.EVENT_TYPE: 'data_depot_trash',
                        Notification.STATUS: Notification.ERROR,
                        Notification.OPERATION: 'data_depot_trash',
                        Notification.USER: request.user.username,
                        Notification.MESSAGE: 'There was an error moving file/folder to trash.',
                        Notification.EXTRA: {'message': e.response.text}
                    }
                    Notification.objects.create(**event_data)
                    return HttpResponseBadRequest(e.response.text)

        return HttpResponseBadRequest("Unsupported operation")

    @profile_fn
    def delete(self, request, file_mgr_name, system_id, file_path):
        if file_mgr_name == AgaveFileManager.NAME:
            if not request.user.is_authenticated:
                return HttpResponseForbidden('Login required')

            fm = AgaveFileManager(agave_client=request.user.agave_oauth.client)
            try:
                fm.delete(system_id, file_path)
                metrics.info('Data Depot',
                             extra = {
                                 'user': request.user.username,
                                 'sessionId': getattr(request.session, 'session_key', ''),
                                 'operation': 'agave_file_delete',
                                 'info': {
                                     'systemId': system_id,
                                     'filePath': file_path}
                             })
                event_data = {
                    Notification.EVENT_TYPE: 'data_depot',
                    Notification.OPERATION: 'data_depot_delete',
                    Notification.STATUS: Notification.SUCCESS,
                    Notification.USER: request.user.username,
                    Notification.MESSAGE: 'File/folder was deleted.',
                    Notification.EXTRA: {'message': 'ok'}
                }
                Notification.objects.create(**event_data)
                return JsonResponse({'status': 'ok'})
            except HTTPError as e:
                logger.exception(e.response.text)
                event_data = {
                    Notification.EVENT_TYPE: 'data_depot',
                    Notification.OPERATION: 'data_depot_delete',
                    Notification.STATUS: Notification.ERROR,
                    Notification.USER: request.user.username,
                    Notification.MESSAGE: 'There was an error deleting a file/folder.',
                    Notification.EXTRA: {'message': 'ok'}
                }
                Notification.objects.create(**event_data)
                return HttpResponseBadRequest(e.response.text)

        return HttpResponseBadRequest("Unsupported operation")


class FileSearchView(View):
    """ File Search View"""
    @profile_fn
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

    @profile_fn
    def get(self, request, file_mgr_name, system_id, file_path):
        if file_mgr_name == AgaveFileManager.NAME \
            or file_mgr_name == 'public':
            if not request.user.is_authenticated:
                return HttpResponseForbidden('Login required')

            # List permissions as the portal user rather than logged in user.
            # This also works around the issue where pems on private systems are
            # inconsistent.
            fm = AgaveFileManager(agave_client=get_service_account_client())
            pems = fm.list_permissions(system_id, file_path)
            return JsonResponse(pems, encoder=AgaveJSONEncoder, safe=False)

        return HttpResponseBadRequest("Unsupported operation.")

    @profile_fn
    def post(self, request, file_mgr_name, system_id, file_path):
        if request.is_ajax():
            body = json.loads(request.body)
        else:
            body = request.POST.copy()

        if file_mgr_name == AgaveFileManager.NAME \
            or file_mgr_name == 'public':
            if not request.user.is_authenticated:
                return HttpResponseForbidden('Login required')

            fm = AgaveFileManager(agave_client=request.user.agave_oauth.client)
            username = body.get('username')
            permission = body.get('permission')
            try:
                pem = fm.share(system_id, file_path, username, permission)
                metrics.info('Data Depot',
                             extra = {
                                 'user': request.user.username,
                                 'sessionId': getattr(request.session, 'session_key', ''),
                                 'operation': 'data_depot_share',
                                 'info': {
                                     'systemId': system_id,
                                     'filePath': file_path}
                             })
                event_data = {
                    Notification.EVENT_TYPE: 'data_depot',
                    Notification.OPERATION: 'data_depot_share',
                    Notification.STATUS: Notification.SUCCESS,
                    Notification.USER: request.user.username,
                    Notification.MESSAGE: '{} permissions were granted to {}.'.format(permission, username),
                    Notification.EXTRA: {'system': system_id,
                                         'file_path': file_path,
                                         'username': username,
                                         'permission': permission}
                }
                Notification.objects.create(**event_data)
            except HTTPError as err:
                logger.debug(err.response.text)
                event_data = {
                    Notification.EVENT_TYPE: 'data_depot_share',
                    Notification.STATUS: Notification.ERROR,
                    Notification.OPERATION: 'data_depot_share',
                    Notification.USER: request.user.username,
                    Notification.MESSAGE: 'There was an error updating permissions for a file/folder.',
                    Notification.EXTRA: {'message': err.response.text}
                }
                Notification.objects.create(**event_data)
                return HttpResponseBadRequest(err.response.text)
            return JsonResponse(pem, encoder=AgaveJSONEncoder, safe=False)

        return HttpResponseBadRequest("Unsupported operation")

class FileMetaView(View):

    @profile_fn
    def get(self, request, file_mgr_name, system_id, file_path):
        if file_mgr_name == ElasticFileManager.NAME:
            if not request.user.is_authenticated:
                return HttpResponseForbidden('Login required')

            fmgr = AgaveFileManager(agave_client=request.user.agave_oauth.client)
            file_obj = fmgr.listing(system_id, file_path)
            file_dict = file_obj.to_dict()
            file_dict['keywords'] = file_obj.metadata.value['keywords']
            return JsonResponse(file_dict)

        return HttpResponseBadRequest('Unsupported file manager.')

    @profile_fn
    def put(self, request, file_mgr_name, system_id, file_path):
        post_body = json.loads(request.body)
        metadata = post_body.get('metadata', {})
        if file_mgr_name == ElasticFileManager.NAME or not metadata:
            if not request.user.is_authenticated:
                return HttpResponseForbidden('Login required')

            fmgr = AgaveFileManager(agave_client=request.user.agave_oauth.client)
            try:
                file_obj = fmgr.listing(system_id, file_path)
                file_obj.metadata.update(metadata)
                file_dict = file_obj.to_dict()
                file_dict['keyword'] = file_obj.metadata.value['keywords']
                metrics.info('Data Depot',
                             extra = {
                                 'user': request.user.username,
                                 'sessionId': getattr(request.session, 'session_key', ''),
                                 'operation': 'data_depot_metadata_update',
                                 'info': {
                                     'systemId': system_id,
                                     'filePath': file_path,
                                     'metadata': metadata}
                             })
                event_data = {
                    Notification.EVENT_TYPE: 'data_depot',
                    Notification.OPERATION: 'data_depot_metadata_update',
                    Notification.STATUS: Notification.SUCCESS,
                    Notification.USER: request.user.username,
                    Notification.MESSAGE: 'Metadata was updated successfully.',
                    Notification.EXTRA: {'systemId': system_id,
                                         'filePath': file_path,
                                         'metadata': metadata}
                }
                Notification.objects.create(**event_data)
            except HTTPError as err:
                logger.debug(err.response.text)
                event_data = {
                    Notification.EVENT_TYPE: 'data_depot',
                    Notification.STATUS: Notification.ERROR,
                    Notification.OPERATION: 'data_depot_metadata_update',
                    Notification.USER: request.user.username,
                    Notification.MESSAGE: 'Metadata was updated successfully.',
                    Notification.EXTRA: {'systemId': system_id,
                                         'filePath': file_path,
                                         'metadata': metadata}
                }
                Notification.objects.create(**event_data)
            return JsonResponse(file_dict)

        return HttpResponseBadRequest('Unsupported file manager.')

class SystemsView(View):

    def get(self, request, system_id=None):
        params = request.GET.copy()
        if request.user.is_authenticated:
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

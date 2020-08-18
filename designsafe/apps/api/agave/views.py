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
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from designsafe.apps.api.agave.filemanager.agave import AgaveFileManager
from designsafe.apps.api.agave import get_service_account_client, impersonate_service_account
from designsafe.apps.data.models.agave.util import AgaveJSONEncoder
from designsafe.apps.data.models.agave.files import BaseFileResource
from designsafe.apps.data.models.agave.systems import BaseSystemResource
from designsafe.apps.api.notifications.models import Notification
from designsafe.apps.api.views import BaseApiView
from designsafe.libs.common.decorators import profile as profile_fn
from requests import HTTPError
from designsafe.apps.api.agave.filemanager.lookups import FileLookupManager
from designsafe.apps.api.search.searchmanager.lookups import SearchLookupManager


logger = logging.getLogger(__name__)
metrics = logging.getLogger('metrics')


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
        fm_cls = FileLookupManager(file_mgr_name)
        fm = fm_cls(None)
        if fm.requires_auth and not request.user.is_authenticated:
            return HttpResponseForbidden('Login Required.')

        if file_mgr_name == 'agave':
            all = request.GET.get("all")
            client = request.user.agave_oauth.client
            fmgr = AgaveFileManager(agave_client=client)
            file_obj = fmgr.listing(system_id, file_path)
            if all:
                file_uuid = file_obj.uuid
                query = {"associationIds": file_uuid}
                objs = client.meta.listMetadata(q=json.dumps(query))
                return JsonResponse([o.value for o in objs], safe=False)
            file_dict = file_obj.to_dict()
            file_dict['keywords'] = file_obj.metadata.value['keywords']
            return JsonResponse(file_dict)
        elif file_mgr_name in ['public', 'community', 'published']:
            pems = [{'username': 'AnonymousUser',
                    'permission': {'read': True,
                                'write': False,
                                'execute': False}}]
            if request.user.is_authenticated:
                pems.append({'username': request.user.username,
                            'permission': {'read': True,
                                            'write': False,
                                            'execute': False}})

            return JsonResponse(pems, safe=False)
        return HttpResponseBadRequest('Unsupported file manager.')

    @profile_fn
    def put(self, request, file_mgr_name, system_id, file_path):
        fm_cls = FileLookupManager(file_mgr_name)
        fm = fm_cls(None)
        if fm.requires_auth and not request.user.is_authenticated:
            return HttpResponseForbidden('Login Required.')

        post_body = json.loads(request.body)
        metadata = post_body.get('metadata', {})
        if file_mgr_name == 'agave' or not metadata:
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

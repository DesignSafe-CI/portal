from django.conf import settings
from django.shortcuts import render, render_to_response
from django.contrib.auth.decorators import login_required
from django.http import HttpResponse, StreamingHttpResponse
from django.views.decorators.http import require_http_methods
from django.utils.decorators import method_decorator
#from dsapi.agave.files import *
from agavepy.agave import Agave, AgaveException
from designsafe.apps.data.apps import DataEvent

from .base import BaseView
from dsapi.agave.daos import AgaveFolderFile, AgaveMetaFolderFile, AgaveFilesManager

import json, requests, traceback

if settings.DEBUG:
    import ipdb

import logging
logger = logging.getLogger(__name__)

class ListingsView(BaseView):
    
    def set_context_props(self, request, **kwargs):
        super(ListingsView, self).set_context_props(request, **kwargs)

    def get(self, request, *args, **kwargs):
        self.set_context_props(request, **kwargs)
        manager = AgaveFilesManager(self.agave_client)
        l = manager.list_meta_path(system_id = self.filesystem, 
                                    path = self.file_path)
        return self.render_to_json_response([o.as_json() for o in l])

class DownloadView(BaseView):

    def set_context_props(self, request, **kwargs):
        super(DownloadView, self).set_context_props(request, **kwargs)

    def get(self, request, *args, **kwargs):
        self.set_context_props(request, **kwargs)
        f = AgaveFolderFile.from_path(agave_client = self.agave_client,
                system_id = self.filesystem, 
                path = self.file_path)
        logger.info('Downloading: {}'.format(f.link))
        ds = f.download_stream(headers = {'Authorization': 'Bearer %s' % self.access_token})
        return StreamingHttpResponse(ds.content, content_type=f.mime_type, status=200)

class UploadView(BaseView):
    def post(self, request, *args, **kwargs):
        self.set_context_props(request, **kwargs)
        if settings.DEBUG:
            ipdb.set_trace()
        ufs = request.FILES
        mgr = AgaveFilesManager(self.agave_client)
        mfs, fs = mgr.upload_files(ufs, system_id = self.filesystem, path = self.file_path)
        return self.render_to_json_response({'files': [o.as_json() for o in fs], 
                                             'filesMeta': [o.as_json() for o in mfs]})

class ManageView(BaseView):
    def set_context_props(self, request, **kwargs):
        super(ManageView, self).set_context_props(request, **kwargs)
        mngr = AgaveFilesManager(agave_client = self.agave_client)
        return mngr

    def put(self, request, *args, **kwargs):
        mngr = self.set_context_props(request, **kwargs)
        body = json.loads(request.body)
        action = body.get('action', None)
        path = request.user.username + body.get('path', None)
        op = getattr(mngr, action)
        mf, f = op(path = self.file_path, new = path, system_id = self.filesystem)
        return self.render_to_json_response(mf.as_json())

    def delete(self, request, *args, **kwargs):
        self.set_context_props(request, **kwargs)
        mf = AgaveMetaFolderFile.from_path(agave_client = self.agave_client,
                                    system_id = self.filesystem,
                                    path = self.file_path)
        mf.deleted = 'true'
        mf.save()
        return self.render_to_json_response(mf.as_json())

class MetadataView(BaseView):
    def set_context_props(self, request, **kwargs):
        super(MetadataView, self).set_context_props(request, **kwargs)
        f = AgaveMetaFolderFile.from_path(
                agave_client = self.agave_client,
                system_id = self.filesystem,
                path = self.file_path)
        return f

    def get(self, request, *args, **kwargs):
        f = self.set_context_props(request, **kwargs)
        return self.render_to_json_response(f.as_json())

    def post(self, request, *args, **kwargs):
        f = self.set_context_props(request, **kwargs)
        body = json.loads(request.body)
        meta = body.get('metadata', None)
        f = f.update_from_json(meta)
        return self.render_to_json_response(f.as_json())

class MetaSearchView(BaseView):
    def set_context_props(self, request, **kwargs):
        super(MetaSearchView, self).set_context_props(request, **kwargs)
        mgr = AgaveFilesManager(agave_client = self.agave_client)
        return mgr

    def get(self, request, *args, **kwargs):
        mgr = self.set_context_props(request, **kwargs)
        res = mgr.search_meta(request.GET.get('q', None))
        return self.render_to_json_response([o.as_json() for o in res])

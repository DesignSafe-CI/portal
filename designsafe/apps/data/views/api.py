from django.conf import settings
from django.shortcuts import render, render_to_response
from django.contrib.auth.decorators import login_required
from django.http import HttpResponse, StreamingHttpResponse
from django.views.decorators.http import require_http_methods
from django.utils.decorators import method_decorator
#from dsapi.agave.files import *
from agavepy.agave import Agave, AgaveException
from designsafe.apps.data.apps import DataEvent

from .base import BaseView, BaseJSONView
from dsapi.agave.daos import AgaveFolderFile, AgaveMetaFolderFile, AgaveFilesManager, FileManager

import json, requests, traceback
import logging
from designsafe.libs.elasticsearch.api import Object
logger = logging.getLogger(__name__)

class ListingsView(BaseJSONView):
    def set_context_props(self, request, **kwargs):
        super(ListingsView, self).set_context_props(request, **kwargs)

    def get(self, request, *args, **kwargs):
        self.set_context_props(request, **kwargs)
        #import ipdb; ipdb.set_trace()
        #obj = Object()
        #es_res, es_s = obj.search_exact_path(self.filesystem, request.user.username, 'xirdneh', 'apps')
        #es_res, es_s = obj.search_partial_path(self.filesystem, request.user.username, 'xirdneh/data')
        #manager = AgaveFilesManager(self.agave_client)
        #if self.file_path == request.user.username:
        #    manager.check_shared_folder(system_id = self.filesystem, 
        #                            username = request.user.username)
        #l = manager.list_meta_path(system_id = self.filesystem, 
        #                            path = self.file_path, 
        #                            special_dir = self.special_dir, 
        #                            username = request.user.username)
        #return self.render_to_json_response([o.as_json() for o in l])
        mgr = FileManager(agave_client = self.agave_client)
        if self.file_path == request.user.username:
            mgr.check_shared_folder(system_id = self.filesystem,
                                    username = request.user.username)
        l = mgr.list_path(system_id = self.filesystem,
                      path = self.file_path,
                      username = request.user.username,
                      special_dir = self.special_dir)
        return self.render_to_json_response([o.to_dict() for o in l])

class DownloadView(BaseJSONView):

    def set_context_props(self, request, **kwargs):
        super(DownloadView, self).set_context_props(request, **kwargs)

    def get(self, request, *args, **kwargs):
        self.set_context_props(request, **kwargs)
        f = AgaveFolderFile.from_path(agave_client = self.agave_client,
                system_id = self.filesystem, 
                path = self.file_path)
        postit_link = f.download_postit()
        logger.info('Posit Link: {}'.format(postit_link))
        resp = {
            'filename': f.name,
            'link': postit_link
        }
        return self.render_to_json_response(resp)

class UploadView(BaseJSONView):
    def post(self, request, *args, **kwargs):
        self.set_context_props(request, **kwargs)
        ufs = request.FILES
        mgr = FileManager(self.agave_client)
        mfs, fs = mgr.upload_files(ufs, system_id = self.filesystem, path = self.file_path)
        return self.render_to_json_response({'files': [o.as_json() for o in fs], 
                                             'filesMeta': [o.to_dict() for o in mfs]})

class ManageView(BaseJSONView):
    def set_context_props(self, request, **kwargs):
        super(ManageView, self).set_context_props(request, **kwargs)
        mngr = FileManager(agave_client = self.agave_client)
        return mngr

    def put(self, request, *args, **kwargs):
        mngr = self.set_context_props(request, **kwargs)
        body = json.loads(request.body)
        action = body.get('action', None)
        path = request.user.username + body.get('path', None)
        op = getattr(mngr, action)
        mf, f = op(path = self.file_path, new = path, system_id = self.filesystem, username = request.user.username)
        return self.render_to_json_response(mf.to_dict())

    def delete(self, request, *args, **kwargs):
        self.set_context_props(request, **kwargs)
        mf = FileManager(agave_client = self.agave_client)
        mf.delete(self.filesystem, self.file_path, request.user.username)
        return self.render_to_json_response(mf.to_dict())

class ShareView(BaseJSONView):
    def post(self, request, *args, **kwargs):
        self.set_context_props(request, **kwargs)
        mngr = FileManager(agave_client = self.agave_client)
        body = json.loads(request.body)
        action = body.get('action', None)
        user = body.get('user', None)
        permission = body.get('permission', None)
        op = getattr(mngr, action)
        resp = op(system_id = self.filesystem, path = self.file_path, 
                  username = user, permission = permission,
                  me = request.user.username)
        return self.render_to_json_response(resp)

class MetadataView(BaseJSONView):
    def set_context_props(self, request, **kwargs):
        super(MetadataView, self).set_context_props(request, **kwargs)
        mgr = FileManager(self.agave_client)
        return mgr.get(system_id = self.filesystem, 
                       path = self.file_path, username = request.user.username)

    def get(self, request, *args, **kwargs):
        f = self.set_context_props(request, **kwargs)
        return self.render_to_json_response(f.to_dict())

    def post(self, request, *args, **kwargs):
        f = self.set_context_props(request, **kwargs)
        body = json.loads(request.body)
        meta = body.get('metadata', None)
        import ipdb; ipdb.set_trace()
        f.update(**meta)
        return self.render_to_json_response(f.to_dict())

class MetaSearchView(BaseJSONView):
    def set_context_props(self, request, **kwargs):
        super(MetaSearchView, self).set_context_props(request, **kwargs)
        mgr = FileManager(agave_client = self.agave_client)
        return mgr

    def get(self, request, *args, **kwargs):
        mgr = self.set_context_props(request, **kwargs)
        import ipdb; ipdb.set_trace()
        res = mgr.search_meta(request.GET.get('q', None), self.filesystem, request.user.username)
        return self.render_to_json_response([o.to_dict() for o in res])

from django.conf import settings
from django.shortcuts import render, render_to_response
from django.contrib.auth.decorators import login_required
from django.http import HttpResponse, StreamingHttpResponse
from django.views.decorators.http import require_http_methods
from django.utils.decorators import method_decorator
#from dsapi.agave.files import *
from agavepy.agave import Agave, AgaveException
from designsafe.apps.data.apps import DataEvent
from designsafe.apps.data import tasks

from .base import BaseView, BasePrivateJSONView, BasePublicJSONView
from dsapi.agave.daos import AgaveFolderFile, AgaveMetaFolderFile, AgaveFilesManager, FileManager

import json 
import requests
import traceback
import itertools
import logging
from designsafe.libs.elasticsearch.api import Object
logger = logging.getLogger(__name__)

class ListingsMixin(object):
    def set_context_props(self, request, **kwargs):
        super(ListingsMixin, self).set_context_props(request, **kwargs)

    def get(self, request, *args, **kwargs):
        self.set_context_props(request, **kwargs)
        mgr = FileManager(agave_client = self.agave_client)
        if self.file_path == request.user.username:
            mgr.check_shared_folder(system_id = self.filesystem,
                                    username = request.user.username)
        l = mgr.list_path(system_id = self.filesystem,
                      path = self.file_path,
                      username = request.user.username,
                      special_dir = self.special_dir,
                      is_public = self.is_public)
        response = [o.to_dict() for o in l]
        if getattr(settings, 'AGAVE_FAILBACK', None):
            status = 200
        else:
            #TODO: Remove this if we're always gonna failback to agvefs direct calls.
            if response:
                #If there are things in the folder
                status = 200
            else:
                #If the folder is empty check if the metadata exists
                #TODO: this should be done in dsapi
                meta_obj, ret = mgr.get(system_id = self.filesystem,
                        path = self.file_path,
                        username = request.user.username,
                        is_public = self.is_public)
                if meta_obj:
                    status = 200
                else:
                    status = 404
        return self.render_to_json_response(response, status = status)


class ListingsView(ListingsMixin, BasePrivateJSONView):
    pass
class PublicListingsView(ListingsMixin, BasePublicJSONView):
    pass
 
class DownloadMixin(object):
    def set_context_props(self, request, **kwargs):
        super(DownloadMixin, self).set_context_props(request, **kwargs)

    def get(self, request, *args, **kwargs):
        self.set_context_props(request, **kwargs)
        f = AgaveFolderFile.from_path(agave_client = self.agave_client,
                system_id = self.filesystem, 
                path = self.file_path)
        postit_link = f.download_postit()
        resp = {
            'filename': f.name,
            'link': postit_link
        }
        return self.render_to_json_response(resp)
class DownloadView(DownloadMixin, BasePrivateJSONView):
    pass
class PublicDownloadView(DownloadMixin, BasePublicJSONView):
    pass

class UploadView(BasePrivateJSONView):
    def post(self, request, *args, **kwargs):
        self.set_context_props(request, **kwargs)
        ufs = request.FILES
        mgr = FileManager(self.agave_client)
        mfs, fs = mgr.upload_files(ufs, system_id = self.filesystem, path = self.file_path)
        return self.render_to_json_response({'files': [o.as_json() for o in fs], 
                                             'filesMeta': [o.to_dict() for o in mfs]})

class ManageView(BasePrivateJSONView):
    def set_context_props(self, request, **kwargs):
        super(ManageView, self).set_context_props(request, **kwargs)
        mngr = FileManager(agave_client = self.agave_client)
        return mngr

    def put(self, request, *args, **kwargs):
        mngr = self.set_context_props(request, **kwargs)
        body = json.loads(request.body)
        action = body.get('action', None)
        path = body.get('path', None)
        if not self.special_dir:
            path = request.user.username + body.get('path', None)
        op = getattr(mngr, action)
        mf, f = op(path = self.file_path, new = path, system_id = self.filesystem, username = request.user.username)
        return self.render_to_json_response(mf.to_dict())

    def delete(self, request, *args, **kwargs):
        self.set_context_props(request, **kwargs)
        mf = FileManager(agave_client = self.agave_client)
        o = mf.delete(self.filesystem, self.file_path, request.user.username)
        return self.render_to_json_response(o.to_dict())

class ShareView(BasePrivateJSONView):
    def post(self, request, *args, **kwargs):
        self.set_context_props(request, **kwargs)    
        body = json.loads(request.body)
        action = body.get('action', None)
        user = body.get('user', None)
        permission = body.get('permission', None)

        DataEvent.send_generic_event({
                  'username_from': request.user.username,
                  'username_to': user,
                  'permission': permission,
                  'action': 'share_start',
                  'path': self.file_path,
                  'action_link': { 'label': 'View Files', 'value': '/data/my/#/Shared with me/' + self.file_path},
                  'html':[
                      {'Message''Your files are been shared.'},
                      {'Action': 'Sharing Sarting'}, 
                      {'Shared with': user},
                      {'Permissions set': permission},
                      ]
                  },
                  [request.user.username])

        tasks.share.delay(system_id = self.filesystem,
              path = self.file_path, username = user,
              permission = permission, me = request.user.username)
        return self.render_to_json_response({'message':'Sharing...'})
    #    mngr = FileManager(agave_client = self.agave_client)
    #    body = json.loads(request.body)
    #    action = body.get('action', None)
    #    user = body.get('user', None)
    #    permission = body.get('permission', None)
    #    op = getattr(mngr, action)
    #    resp = op(system_id = self.filesystem, path = self.file_path, 
    #              username = user, permission = permission,
    #              me = request.user.username)
    #    return self.render_to_json_response(resp)

class MetadataMixin(object):
    def set_context_props(self, request, **kwargs):
        super(MetadataMixin, self).set_context_props(request, **kwargs)
        mgr = FileManager(self.agave_client)
        return mgr.get(system_id = self.filesystem, 
                       path = self.file_path, 
                       username = request.user.username,
                       is_public = self.is_public)

    def get(self, request, *args, **kwargs):
        meta, meta_dict = self.set_context_props(request, **kwargs)
        if meta and meta_dict:
            status = 200
        else:
            status = 404
        return self.render_to_json_response(meta_dict, status = status)

    def post(self, request, *args, **kwargs):
        meta_obj, meta_dict = self.set_context_props(request, **kwargs)
        body = json.loads(request.body)
        meta = body.get('metadata', None)
        #Remove duplicates
        if 'keywords' in meta:
            meta['keywords'] = list(set(meta['keywords']))
        meta_obj.update(**meta)
        return self.render_to_json_response(meta_obj.to_dict())

class MetadataView(MetadataMixin, BasePrivateJSONView):
    pass
class PublicMetadataView(MetadataMixin, BasePublicJSONView):
    pass

class MetaSearchMixin(object):
    def set_context_props(self, request, **kwargs):
        super(MetaSearchMixin, self).set_context_props(request, **kwargs)
        mgr = FileManager(agave_client = self.agave_client)
        return mgr

    def get(self, request, *args, **kwargs):
        status = 200
        mgr = self.set_context_props(request, **kwargs)
        res, search = mgr.search_meta(request.GET.get('q', None), 
                          self.filesystem, 
                          request.user.username, 
                          is_public = self.is_public)
        res_search = search[0:10]
        response = [o.to_dict() for o in res_search]
        if self.is_public:
            p_res, p_search = mgr.search_public_meta(request.GET.get('q', None), 
                              self.filesystem, 
                              request.user.username)
            p_res = [o.to_dict() for o in p_search.scan()]
            response = p_res + response
        return self.render_to_json_response(response, status = status)

class MetaSearchView(MetaSearchMixin, BasePrivateJSONView):
    pass
class PublicMetaSearchView(MetaSearchMixin, BasePublicJSONView):
    pass

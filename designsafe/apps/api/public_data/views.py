"""Main views for public data. api/public/*
   All these views return :class:`JsonResponse`s
   These should be general enough to handle various type of public data.

   As of Nov/2016 we only have old NEES public data which we render in a
   file browser manner with metadata saved in ElasticSearch.
   Next step is to render publications coming from designsafe as well as
   comunity data and training materials. The actual definition of community data
   and training materials is still being discussed.

   ..note:: We also need to keep in mind that we'll have to implement a way to
   render rich metadata as well as external publications.
   External publications should be accessible through an API. This will get handle
   on a case-by-case basis."""

import logging
import json
import os
from django.core.urlresolvers import reverse
from django.http import (HttpResponseRedirect,
                         HttpResponseBadRequest,
                         HttpResponseForbidden,
                         HttpResponseServerError,
                         JsonResponse)
from django.shortcuts import render
from django.contrib.auth import get_user_model, login
from designsafe.apps.api.views import BaseApiView
from designsafe.apps.api.mixins import SecureMixin
from designsafe.apps.api.agave import get_service_account_client
from designsafe.apps.api.agave.models.files import BaseFileResource
from designsafe.apps.api.agave.models.util import AgaveJSONEncoder
from designsafe.apps.api.agave.filemanager.public_search_index import PublicElasticFileManager
from designsafe.apps.api.agave.filemanager.community import CommunityFileManager
from designsafe.apps.api.agave.filemanager.published import PublishedFileManager
from designsafe.apps.api.agave.views import FileMediaView

logger = logging.getLogger(__name__)

class PublicDataListView(BaseApiView):
    """Main view to handle list requests for published data"""
    def get(self, request, file_mgr_name,
            system_id=None, file_path=None):
        """GET handler."""
        logger.info('file_mgr_name: %s', file_mgr_name)
        if file_mgr_name not in [PublicElasticFileManager.NAME,
                                 'community',
                                 'published']:
            return HttpResponseBadRequest('Wrong Manager')

        if system_id is None:
            system_id = PublicElasticFileManager.DEFAULT_SYSTEM_ID
        
        if file_mgr_name == PublicElasticFileManager.NAME:
            file_mgr = PublicElasticFileManager()
        elif file_mgr_name == 'community':
            ag = get_user_model().objects.get(username='envision').agave_oauth.client
            file_mgr = CommunityFileManager(ag)
        elif file_mgr_name == 'published':
            ag = get_user_model().objects.get(username='envision').agave_oauth.client
            file_mgr = PublishedFileManager(ag)
            #listing = file_mgr.listing(system_id, file_path)
            #return JsonResponse({'response': 'ok'})

        offset = int(request.GET.get('offset', 0))
        limit = int(request.GET.get('limit', 100))
        listing = file_mgr.listing(system_id, file_path, offset, limit)
        return JsonResponse(listing.to_dict())

class PublicMediaView(FileMediaView):
    """Media view to render metadata"""

    def get(self, request, *args, **kwargs):
        return super(PublicMediaView, self).get(request, *args, **kwargs)
    
    def post(self, request, *args, **kwargs):
        return HttpResponseBadRequest('Invalid Action')

    def put(self, request, *args, **kwargs):
        if request.is_ajax():
            body = json.loads(request.body)
        else:
            body = request.POST.copy()

        action = body.get('action', '')
        if action in ['mkdir', 'move', 'rename', 'trash']:
            return HttpResponseBadRequest('Invalid Action')

        return super(PublicMediaView, self).put(request, *args, **kwargs)

    def delete(self, request, *args, **kwargs):
        return HttpResponseBadRequest('Invalid Action')


class PublicSearchView(BaseApiView):
    """ Search view """
    def get(self, request, file_mgr_name,
            system_id=None, file_path=None):
        """GET handler"""
        offset = int(request.GET.get('offset', 0))
        limit = int(request.GET.get('limit', 100))
        query_string = request.GET.get('query_string')
        logger.debug('offset: %s, limit: %s, query_string: %s' % (str(offset), str(limit), query_string))
        if file_mgr_name != PublicElasticFileManager.NAME or not query_string:
            return HttpResponseBadRequest()

        if system_id is None:
            system_id = PublicElasticFileManager.DEFAULT_SYSTEM_ID

        file_mgr = PublicElasticFileManager()
        listing = file_mgr.search(system_id, query_string,
                                  offset=offset, limit=limit)
        # logger.info(listing)
        return JsonResponse(listing)

class PublicPemsView(BaseApiView):
    """ Pems View.
        Since this are the permissions for the published data,
        we will only return an array with the request username and
        READ permission. """
    def get(self, request, file_mgr_name,
            system_id = None, file_path = None):
        """ GET handler """
        if file_mgr_name not in [PublicElasticFileManager.NAME,
                                 'community',
                                 'published']:
            return HttpResponseBadRequest()

        if system_id is None:
            system_id = PublicElasticFileManager.DEFAULT_SYSTEM_ID

        pems = [{'username': 'AnonymousUser', 
                'permission': {'read': True,
                               'write': False,
                               'execute': False}}]
        if request.user.is_authenticated():
            pems.append({'username': request.user.username, 
                         'permission': {'read': True,
                                        'write': False,
                                        'execute': False}})
                             
        return JsonResponse(pems, safe=False)


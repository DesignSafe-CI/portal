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
from designsafe.apps.api.views import BaseApiView
from designsafe.apps.api.mixins import SecureMixin
from designsafe.apps.api.agave import get_service_account_client
from designsafe.apps.api.agave.models.files import BaseFileResource
from designsafe.apps.api.agave.models.util import AgaveJSONEncoder
from designsafe.apps.api.agave.filemanager.public_search_index import PublicElasticFileManager

logger = logging.getLogger(__name__)

class PublicDataListView(BaseApiView):
    """Main view to handle list requests for published data"""
    def get(self, request, file_mgr_name,
            system_id=None, file_path=None):
        """GET handler."""
        if file_mgr_name != PublicElasticFileManager.NAME:
            return HttpResponseBadRequest()

        if system_id is None:
            system_id = PublicElasticFileManager.DEFAULT_SYSTEM_ID

        file_mgr = PublicElasticFileManager()
        offset = int(request.GET.get('offset', 0))
        limit = int(request.GET.get('limit', 100))
        listing = file_mgr.listing(system_id, file_path, offset, limit)

        return JsonResponse(listing.to_dict())

class PublicMediaView(BaseApiView):
    """Media view to render metadata"""
    def get(self, request, file_mgr_name,
            system_id=None, file_path=None):
        """GET handler."""
        if file_mgr_name != PublicElasticFileManager.NAME:
            return HttpResponseBadRequest()

        if system_id is None:
            system_id = PublicElasticFileManager.DEFAULT_SYSTEM_ID

        file_mgr = PublicElasticFileManager()
        listing = file_mgr.listing(system_id, file_path)

        return JsonResponse(listing.to_dict())

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
        return JsonResponse(listing)

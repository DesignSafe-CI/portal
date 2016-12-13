"""Main views for sitewide search data. api/search/?*
   All these views return :class:`JsonResponse`s
   These should be general enough to handle various type of public data
   and for authenticated users any private data that they can
   access.
"""

import logging
import json
import os
from django.core.urlresolvers import reverse
from django.http import (HttpResponseRedirect,
                         HttpResponseBadRequest,
                         HttpResponseForbidden,
                         HttpResponseServerError,
                         JsonResponse)
from designsafe.apps.api.views import BaseApiView
from designsafe.apps.api.mixins import SecureMixin
from designsafe.apps.api.agave import get_service_account_client
from designsafe.apps.api.agave.models.files import BaseFileResource
from designsafe.apps.api.agave.models.util import AgaveJSONEncoder
from designsafe.apps.api.agave.filemanager.public_search_index import PublicElasticFileManager

logger = logging.getLogger(__name__)

class SearchView(BaseApiView):
    """Main view to handle sitewise search requests"""
    def get(self, request):
        """GET handler."""
        q = request.GET.get('q')
        system_id = PublicElasticFileManager.DEFAULT_SYSTEM_ID
        file_mgr = PublicElasticFileManager()
        offset = int(request.GET.get('offset', 0))
        limit = int(request.GET.get('limit', 100))
        listing = file_mgr.search(system_id, q, offset=offset, limit=limit)
        return JsonResponse(listing)




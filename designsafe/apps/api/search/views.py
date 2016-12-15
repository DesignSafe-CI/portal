"""Main views for sitewide search data. api/search/?*
   All these views return :class:`JsonResponse`s
   These should be general enough to handle various type of public data
   and for authenticated users any private data that they can
   access.
"""

import logging
import json
from elasticsearch_dsl.query import Q
from django.core.urlresolvers import reverse
from django.http import (HttpResponseRedirect,
                         HttpResponseBadRequest,
                         HttpResponseForbidden,
                         HttpResponseServerError,
                         JsonResponse)
from designsafe.apps.api.views import BaseApiView
from designsafe.apps.api.mixins import SecureMixin
from designsafe.apps.api.agave.filemanager.public_search_index import (
    PublicElasticFileManager, PublicObjectIndexed,
    PublicProjectIndexed, PublicExperimentIndexed)

logger = logging.getLogger(__name__)


class SearchView(BaseApiView):
    """Main view to handle sitewise search requests"""
    def get(self, request):
        """GET handler."""
        q = request.GET.get('q')
        system_id = PublicElasticFileManager.DEFAULT_SYSTEM_ID
        offset = int(request.GET.get('offset', 0))
        limit = int(request.GET.get('limit', 100))
        # listing = file_mgr.search(system_id, q, offset=offset, limit=limit)
        projects_query = Q('filtered',
                           filter=Q('bool',
                                    must=Q({'term': {'systemId': system_id}}),
                                    must_not=Q({'term': {'path._exact': '/'}})),
                           query=Q({'simple_query_string': {
                                    'query': q,
                                    'fields': ["description",
                                               "endDate",
                                               "equipment.component",
                                               "equipment.equipmentClass",
                                               "equipment.facility",
                                               "fundorg"
                                               "fundorgprojid",
                                               "name",
                                               "organization.name",
                                               "pis.firstName",
                                               "pis.lastName",
                                               "title"]}}))
        logger.debug(projects_query)
        out = {}
        res = PublicProjectIndexed.search()\
                .filter(projects_query)\
                .source(include=['description', 'name', 'title', 'project', 'highlight', 'startDate', 'endDate'])\
                .sort('_score').execute()
        out["projects"] = [r.to_dict() for r in res[offset:limit]]

        files_query = Q('filtered',
                        query=Q({'simple_query_string': {
                                 'query': q,
                                 'fields': ['name']}}),
                        filter=Q('bool',
                                 must=Q({'term': {'systemId': system_id}}),
                                 must_not=Q({'term': {'path._exact': '/'}})))
        res = PublicObjectIndexed.search()\
                .filter(files_query)\
                .sort('_score').execute()
        out["files"] = [r.to_dict() for r in res[offset:limit]]

        experiments_query = Q('filtered',
                           filter=Q('bool',
                                    must=Q({'term': {'systemId': system_id}}),
                                    must_not=Q({'term': {'path._exact': '/'}})),
                           query=Q({'simple_query_string': {
                                    'query': q,
                                    'fields': ["description",
                                               "name",
                                               "title"]}}))
        res = PublicExperimentIndexed.search()\
                .filter(experiments_query)\
                .source(include=['description', 'name', 'title', 'type', 'startDate', 'endDate'])\
                .sort('_score').execute()
        out["experiments"] = [r.to_dict() for r in res[offset:limit]]
        return JsonResponse(out, safe=False)




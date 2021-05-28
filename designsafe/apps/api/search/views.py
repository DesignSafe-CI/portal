"""Main views for sitewide search data. api/search/?*
   All these views return :class:`JsonResponse`s
   These should be general enough to handle various type of public data
   and for authenticated users any private data that they can
   access.
"""
import logging
import operator
from elasticsearch_dsl import Q, Search, Index
from elasticsearch import TransportError, ConnectionTimeout
from django.http import (HttpResponseBadRequest,
                         JsonResponse)
from django.conf import settings
from designsafe.apps.api.views import BaseApiView

from designsafe.apps.api.search.searchmanager.community import CommunityDataSearchManager
from designsafe.apps.api.search.searchmanager.published_files import PublishedDataSearchManager
from designsafe.apps.api.search.searchmanager.cms import CMSSearchManager
from designsafe.apps.api.search.searchmanager.publications_site_search import PublicationsSiteSearchManager

logger = logging.getLogger(__name__)


class SearchView(BaseApiView):
    """Main view to handle sitewise search requests"""
    def get(self, request):
        """GET handler."""
        q = request.GET.get('query_string')
        offset = int(request.GET.get('offset', 0))
        limit = int(request.GET.get('limit', 10))
        if limit > 500:
            return HttpResponseBadRequest("limit must not exceed 500")
        type_filter = request.GET.get('type_filter', 'all')
        doc_type_map = {
            list(Index(settings.ES_INDEX_PREFIX.format('publications')).get_alias().keys())[0]: 'publication',
            list(Index(settings.ES_INDEX_PREFIX.format('publications-legacy')).get_alias().keys())[0]: 'publication',
            list(Index(settings.ES_INDEX_PREFIX.format('files')).get_alias().keys())[0]: 'file',
            list(Index(settings.ES_INDEX_PREFIX.format('cms')).get_alias().keys())[0]: 'modelresult'
        }

        public_files_query = CommunityDataSearchManager(request).construct_query() | PublishedDataSearchManager(request).construct_query()
        published_files_query = PublishedDataSearchManager(request).construct_query()
        publications_query = PublicationsSiteSearchManager(request).construct_query()
        cms_query = es_query = CMSSearchManager(request).construct_query()

        if type_filter == 'public_files':
            es_query = Search().query(public_files_query)
        if type_filter == 'published_files':
            es_query = Search().query(public_files_query)
        elif type_filter == 'published':
            es_query = Search().query(publications_query)
        elif type_filter == 'cms':
            es_query = Search().query(cms_query).highlight(
                    'body',
                    fragment_size=100).highlight_options(
                    pre_tags=["<b>"],
                    post_tags=["</b>"],
                    require_field_match=False)
        elif type_filter == 'all':
            es_query = Search().query(public_files_query | publications_query | cms_query).highlight(
                    'body',
                    fragment_size=100).highlight_options(
                    pre_tags=["<b>"],
                    post_tags=["</b>"],
                    require_field_match=False)
        es_query = es_query.extra(from_=offset, size=limit)
        try:
            res = es_query.execute()
        except (TransportError, ConnectionTimeout) as err:
            if getattr(err, 'status_code', 500) == 404:
                raise
            res = es_query.execute()

        out = {}
        hits = []

        for r in res:
            d = r.to_dict()
            d["doc_type"] = doc_type_map[r.meta.index]
            if hasattr(r.meta, 'highlight'):
                highlight = r.meta.highlight.to_dict()
                d["highlight"] = highlight
            if r.meta.doc_type == 'publication' and hasattr(r, 'users'):
                users = r.users
                pi = r.project.value.pi
                pi_user = [x for x in users if x.username==pi][0]
                d["piLabel"] = "{}, {}".format(pi_user.last_name, pi_user.first_name)
            hits.append(d)

        out['hits'] = hits
        out['all_total'] = Search().query(public_files_query | publications_query | cms_query).count()
        out['published_files_total'] = Search().query(published_files_query).count()
        out['public_files_total'] = Search().query(public_files_query).count()
        out['published_total'] = Search().query(publications_query).count()
        out['cms_total'] = Search().query(cms_query).count()

        return JsonResponse(out, safe=False)

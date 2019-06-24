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

from designsafe.apps.api.views import BaseApiView
from designsafe.apps.api.agave.filemanager.public_search_index import (
    PublicElasticFileManager)
from designsafe.apps.api.agave.filemanager.search_index import ElasticFileManager

logger = logging.getLogger(__name__)


class SearchView(BaseApiView):
    """Main view to handle sitewise search requests"""
    def get(self, request):
        """GET handler."""
        q = request.GET.get('query_string')
        system_id = PublicElasticFileManager.DEFAULT_SYSTEM_ID
        offset = int(request.GET.get('offset', 0))
        limit = int(request.GET.get('limit', 10))
        if limit > 500:
            return HttpResponseBadRequest("limit must not exceed 500")
        type_filter = request.GET.get('type_filter', 'all')

        if type_filter == 'public_files':
            es_query = SearchView.search_public_files(q, offset, limit)
        elif type_filter == 'published':
            es_query = SearchView.search_published(q, offset, limit)
        elif type_filter == 'cms':
            es_query = SearchView.search_cms_content(q, offset, limit)
        elif type_filter == 'all':
            es_query = SearchView.search_all(q, offset, limit)
            
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
            d["doc_type"] = r.meta.doc_type
            if hasattr(r.meta, 'highlight'):
                highlight = r.meta.highlight.to_dict()
                d["highlight"] = highlight
            if r.meta.doc_type == 'publication' and hasattr(r, 'users'):
                users = r.users
                pi = r.project.value.pi
                pi_user = filter(lambda x: x.username==pi, users)[0]
                d["piLabel"] = "{}, {}".format(pi_user.last_name, pi_user.first_name)
            hits.append(d)

        out['total_hits'] = res.hits.total
        out['hits'] = hits
        out['all_total'] = SearchView.search_all(q, offset, limit).count()
        out['public_files_total'] = SearchView.search_public_files(q, offset, limit).count()
        out['published_total'] = SearchView.search_published(q, offset, limit).count()
        out['cms_total'] = SearchView.search_cms_content(q, offset, limit).count()

        return JsonResponse(out, safe=False)

    @staticmethod
    def search_cms_content(q, offset, limit):
        """search cms content """
        search = Search(index="cms").query(
            "query_string",
            query=q,
            default_operator="and",
            fields=['title', 'body']).extra(
                from_=offset,
                size=limit).highlight(
                    'body',
                    fragment_size=100).highlight_options(
                    pre_tags=["<b>"],
                    post_tags=["</b>"],
                    require_field_match=False)
        return search

    @staticmethod
    def search_public_files(q, offset, limit):

        split_query = q.split(" ")
        for i, c in enumerate(split_query):
            if c.upper() not in ["AND", "OR", "NOT"]:
                split_query[i] = "*" + c + "*"
        
        q = " ".join(split_query)

        filters = Q('term', system="nees.public") | \
                  Q('term', system="designsafe.storage.published") | \
                  Q('term', system="designsafe.storage.community")
        search = Search(index="des-files")\
            .query("query_string", query=q, default_operator="and")\
            .filter(filters)\
            .filter("term", type="file")\
            .exclude(Q({"prefix": {"path._exact": "/Trash"}}))\
            .extra(from_=offset, size=limit)
        logger.info(search.to_dict())
        return search

    @staticmethod
    def search_published(q, offset, limit):
        query = Q(
            'bool',
            must=[
                Q('query_string', query=q, default_operator='and'),
            ],
            must_not=[
                Q('term', status='unpublished'),
                Q('term', status='saved')
            ]
        )
        search = Search(index=["des-publications_legacy", "des-publications"])\
            .query(query)\
            .extra(from_=offset, size=limit)
        return search

    @staticmethod
    def search_all(q, offset=0, limit=10):
        search = Search()
        published_index_name = Index('des-publications').get_alias().keys()[0]
        legacy_index_name = Index('des-publications_legacy').get_alias().keys()[0]
        files_index_name = Index('des-files').get_alias().keys()[0]

        # Publications query
        published_query = Q(
            'bool',
            must=[
                Q('query_string', query=q, default_operator='and'),
                Q('bool', should=[
                    ({'term': {'_index': published_index_name}}),
                    Q({'term': {'_index': legacy_index_name}})
                ])
            ],
            must_not=[
                Q('term', status='unpublished'),
                Q('term', status='saved')
            ]
        )
        # CMS query 
        cms_query = Q(
            'bool',
            must=[
                Q({'term': {'_index': 'cms'}}),
                Q("query_string",
                    query=q,
                    default_operator="and",
                    fields=['title', 'body'])
            ]
        )
        # Public files query
        split_query = q.split(" ")
        for i, c in enumerate(split_query):
            if c.upper() not in ["AND", "OR", "NOT"]:
                split_query[i] = "*" + c + "*"
        file_q = q = " ".join(split_query)

        system_filters = Q('term', system="nees.public") | \
            Q('term', system="designsafe.storage.published") | \
            Q('term', system="designsafe.storage.community")

        public_files_query = Q(
            'bool',
            must=[
                Q({'term': {'_index': files_index_name}}),
                system_filters,
                Q("query_string", query=file_q, default_operator="and"),
                Q("term", type="file")
            ],
            must_not=[
                Q({"prefix": {"path._exact": "/Trash"}})
            ]
        )

        search = search.query('bool',
                              should=[published_query, cms_query, public_files_query])\
            .extra(from_=offset, size=limit).highlight(
            'body',
            fragment_size=100)\
            .highlight_options(
            pre_tags=["<b>"],
            post_tags=["</b>"],
            require_field_match=False
        )

        return search
"""Main views for sitewide search data. api/search/?*
   All these views return :class:`JsonResponse`s
   These should be general enough to handle various type of public data
   and for authenticated users any private data that they can
   access.
"""
import logging
from elasticsearch_dsl import Q, Search
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
        q = request.GET.get('q')
        system_id = PublicElasticFileManager.DEFAULT_SYSTEM_ID
        offset = int(request.GET.get('offset', 0))
        limit = int(request.GET.get('limit', 10))
        if (limit > 500):
            return HttpResponseBadRequest("limit must not exceed 500")
        type_filter = request.GET.get('type_filter', 'cms')

        if type_filter == 'public_files':
            es_query = self.search_public_files(q, offset, limit)
        elif type_filter == 'published':
            es_query = self.search_nees_projects(q, offset, limit)
        elif type_filter == 'cms':
            es_query = self.search_cms_content(q, offset, limit)
        elif type_filter == 'private_files':
            es_query = self.search_my_data(self.request.user.username, q, offset, limit)

        try:
            res = es_query.execute()
        except (TransportError, ConnectionTimeout) as err:
            if getattr(err, 'status_code', 500) == 404:
                raise
            res = es_query.execute()

        results = [r for r in res]
        out = {}
        hits = []
        if (type_filter != 'publications'):
            for r in results:
                d = r.to_dict()
                d["doc_type"] = r.meta.doc_type
                if hasattr(r.meta, 'highlight'):
                    highlight = r.meta.highlight.to_dict()
                    d["highlight"] = highlight
                hits.append(d)

        out['total_hits'] = res.hits.total
        out['hits'] = hits
        out['public_files_total'] = self.search_public_files(q, offset, limit).count()
        out['nees_total'] = self.search_nees_projects(q, offset, limit).count()
        out['cms_total'] = self.search_cms_content(q, offset, limit).count()
        #out['published_total'] = self.search_public_projects(q, offset, limit).count()
        out['private_files_total'] = 0
        if request.user.is_authenticated:
            out['private_files_total'] = self.search_my_data(self.request.user.username, q, offset, limit).count()

        return JsonResponse(out, safe=False)

    def search_cms_content(self, q, offset, limit):
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
                        require_field_match=False)
        return search

    def search_public_files(self, q, offset, limit):
        search = Search(index="nees", doc_type='object')\
            .query("match", systemId='nees.public')\
            .query("query_string", query=q, default_operator="and")\
            .query("match", type="file")\
            .query("query_string", query=q, default_operator="and", fields=['name'])\
            .filter("term", _type="object")\
            .extra(from_=offset, size=limit)
        return search

    def search_public_projects(self, q, offset, limit):
        query = Q(
            'bool',
            should=[
                Q('nested',
                  path=['users'],
                  query=Q('bool',
                      must=Q(
                          'query_string',
                          query=q,
                          default_operator='and',
                          fields=['users.last_name', 'users.first_name', 'users.email'])
                      )
                  ),
                Q('nested',
                  path=['institutions'],
                  query=Q(
                      'bool',
                      must=Q(
                          'query_string',
                          query=q,
                          default_operator='and',
                          fields=['institutions.label'])
                     )
                  ),
               Q('nested',
                 path=['project'],
                 query=Q(
                     'nested',
                     path=['project.value'],
                     query=Q(
                       'bool',
                       must=Q(
                             'query_string',
                             query=q,
                             default_operator='and',
                             fields=['project.value.projectType',
                                     'project.value.description',
                                     'project.value.title',
                                     'project.value.projectId',
                                     'project.value.ef',
                                     'project.value.keywords',
                                     'project.value.awardNumber'])
                         )
                    )
                 ),
            ])
        search = Search(index="published")\
            .filter(Q("bool", must=[
                {"term": {'_type': "publication"}}
            ]))\
            .extra(from_=offset, size=limit)
        search.query = query
        return search

    def search_nees_projects(self, q, offset, limit):
        query = Q(
            'bool',
            should=[
                Q('query_string',
                  query=q,
                  default_operator='and',
                  fields=['body', 'name', 'description', 'title'])
            ])
        search = Search(index="nees", doc_type='project')\
            .filter(Q("bool", must=[
                {"term": {'_type': "project"}},
            ]))\
            .extra(from_=offset, size=limit)
        search.query = query
        return search

    def search_my_data(self, username, q, offset, limit):
        search = Search(index='designsafe')
        query = Q('bool',
                  filter=Q('bool',
                           must=[Q({'term': {'systemId': 'designsafe.storage.default'}}),
                                 Q({'term': {'permissions.username': username}}),
                                 Q({'prefix': {'path._exact': username}})],
                           must_not=[Q({'prefix': {'path._exact': '{}/.Trash'.format(username)}})]),
                   must=Q({'simple_query_string':{
                            'query': q,
                            'fields': ['name', 'name._exact', 'keywords']}}))
        search.query = query
        return search

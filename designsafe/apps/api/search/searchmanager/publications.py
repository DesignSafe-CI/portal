"""
.. module: portal.apps.api.search.searchmanager.publications
   :synopsis: Manager handling Publications searches.
"""

from __future__ import unicode_literals, absolute_import
import logging
from designsafe.apps.api.search.searchmanager.base import BaseSearchManager
from designsafe.apps.data.models.elasticsearch import IndexedPublication
from elasticsearch_dsl import Q, Search, Index
from django.conf import settings
from designsafe.libs.elasticsearch.docs.publications import BaseESPublication
from designsafe.libs.elasticsearch.docs.publication_legacy import BaseESPublicationLegacy

logger = logging.getLogger(__name__)


class PublicationsSearchManager(BaseSearchManager):
    """ Search manager handling publications.
    """

    def __init__(self, request=None, **kwargs):
        if request:
            self.query_string = request.GET.get('query_string')
        else:
            self.query_string = kwargs.get('query_string')

        super(PublicationsSearchManager, self).__init__(
            IndexedPublication, Search())

    def construct_query(self, system=None, file_path=None, **kwargs):
        project_query_fields = [
            "projectId",
            "title", 
            "description", 
            "project.value.title", 
            "project.value.keywords",
            "project.value.description",
            "project.value.dataType",
            "project.value.projectType",
            "name"
            ]
        published_index_name = Index(settings.ES_INDEX_PREFIX.format('publications')).get_alias().keys()[0]
        legacy_index_name = Index(settings.ES_INDEX_PREFIX.format('publications-legacy')).get_alias().keys()[0]
        filter_queries = []
        if kwargs.get('type_filters'):
            for type_filter in kwargs['type_filters']:
                if type_filter == 'nees':
                    type_query = Q({'term': {'_index': legacy_index_name}})
                else:
                    type_query = Q('term', **{'project.value.projectType._exact': type_filter})
                filter_queries.append(type_query)

        ds_user_query = Q({"nested":
                        {"path": "users",
                         "ignore_unmapped": True,
                         "query": {"query_string":
                                   {"query": self.query_string,
                                    "fields": ["users.first_name",
                                               "users.last_name",
                                               "user.username"],
                                    "lenient": True}}}
                        })
        nees_pi_query = Q({"nested":
                        {"path": "pis",
                         "ignore_unmapped": True,
                         "query": {"query_string":
                                   {"query": self.query_string,
                                    "fields": ["pis.firstName",
                                               "pis.lastName"],
                                    "lenient": True}}}
                        })
        pub_query = Q('query_string', query=self.query_string, default_operator='and', fields=project_query_fields)

        published_query = Q(
            'bool',
            must=[
                Q('bool', should=[ds_user_query, nees_pi_query, pub_query]),
                Q('bool', should=[
                    Q({'term': {'_index': published_index_name}}),
                    Q({'term': {'_index': legacy_index_name}})
                ]),
                Q('bool', should=filter_queries)
            ],
            must_not=[
                Q('term', status='unpublished'),
                Q('term', status='saved')
            ]
        )

        return published_query

    def listing(self, system=None, file_path=None, offset=0, limit=100, **kwargs):
        """Perform the search and output in a serializable format."""

        query = self.construct_query(system, file_path, **kwargs)
        listing_search = Search()
        listing_search = listing_search.filter(query).sort('_index')
        listing_search = listing_search.extra(from_=offset, size=limit)
        res = listing_search.execute()
        children = []
        for hit in res:
            try:
                getattr(hit, 'projectId')
                children.append(BaseESPublication(**hit.to_dict()).to_file())
            except AttributeError:
                children.append(BaseESPublicationLegacy(**hit.to_dict()).to_file())

        result = {
            'trail': [{'name': '$SEARCH', 'path': '/$SEARCH'}],
            'name': '$SEARCH',
            'path': '/',
            'system': system,
            'type': 'dir',
            'children': children,
            'permissions': 'READ'
        }
        return result

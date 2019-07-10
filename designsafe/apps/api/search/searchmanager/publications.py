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

    def construct_query(self, system=None, file_path=None):

        published_index_name = Index('des-publications').get_alias().keys()[0]
        legacy_index_name = Index('des-publications_legacy').get_alias().keys()[0]

        published_query = Q(
            'bool',
            must=[
                Q('query_string', query=self.query_string, default_operator='and'),
                Q('bool', should=[
                    Q({'term': {'_index': published_index_name}}),
                    Q({'term': {'_index': legacy_index_name}})
                ])
            ],
            must_not=[
                Q('term', status='unpublished'),
                Q('term', status='saved')
            ]
        )

        return published_query

    def listing(self, system=None, file_path=None, offset=0, limit=100, **kwargs):
        """Perform the search and output in a serializable format."""

        query = self.construct_query(system, file_path)
        listing_search = Search()
        listing_search = listing_search.query(query).sort('_index')
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

"""
.. module: portal.apps.search.api.managers.private_data_search
   :synopsis: Manager handling My Data searches.
"""

from __future__ import unicode_literals, absolute_import
import logging
from designsafe.apps.api.search.searchmanager.base import BaseSearchManager
from designsafe.apps.data.models.elasticsearch import IndexedFile
from elasticsearch_dsl import Q, Search, Index
from django.conf import settings

logger = logging.getLogger(__name__)


class CommunityDataSearchManager(BaseSearchManager):
    """ Search manager handling Community Data.
    """

    def __init__(self, request=None, **kwargs):
        if request:
            self.query_string = request.GET.get('query_string')
        else:
            self.query_string = kwargs.get('query_string')

        split_query = self.query_string.split(" ")
        for i, c in enumerate(split_query):
            if c.upper() not in ["AND", "OR", "NOT"]:
                split_query[i] = "*" + c + "*"
        self.query_string = " ".join(split_query)

        super(CommunityDataSearchManager, self).__init__(
            IndexedFile, IndexedFile.search())

    def construct_query(self, system=None, file_path=None):

        files_index_name = Index('des-files').get_alias().keys()[0]

        community_files_query = Q(
            'bool',
            must=[
                Q({'term': {'_index': files_index_name}}),
                Q('term', system="designsafe.storage.community"),
                Q("query_string", query=self.query_string, default_operator="and"),
                Q("term", type="file")
            ],
            must_not=[
                Q({"prefix": {"path._exact": "/Trash"}})
            ]
        )

        return community_files_query

    def listing(self, system, file_path, offset=0, limit=100, **kwargs):
        """Perform the search and output in a serializable format."""

        query = self.construct_query(system, file_path)
        listing_search = Search()
        listing_search = listing_search.query(query)
        listing_search = listing_search.extra(from_=offset, size=limit)
        res = listing_search.execute()
        
        children = []
        print res.hits.total
        if res.hits.total:
            children = [o.to_dict() for o in res]

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

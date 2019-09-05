"""
.. module: portal.apps.api.search.searchmanager.private_data
   :synopsis: Manager handling My Data searches.
"""
import logging
from designsafe.apps.api.search.searchmanager.base import BaseSearchManager
from designsafe.apps.data.models.elasticsearch import IndexedFile
from elasticsearch_dsl import Q, Search, Index
from django.conf import settings

logger = logging.getLogger(__name__)


class PrivateDataSearchManager(BaseSearchManager):
    """ Search manager handling My Data and project data.
    """

    def __init__(self, request=None, **kwargs):
        if request:
            self.query_string = request.GET.get('query_string')
            self.username = request.user.username
        else:
            self.query_string = kwargs.get('query_string')
            self.username = kwargs.get('username')

        split_query = self.query_string.split(" ")
        for i, c in enumerate(split_query):
            if c.upper() not in ["AND", "OR", "NOT"]:
                split_query[i] = "*" + c + "*"
        self.query_string = " ".join(split_query)

        super(PrivateDataSearchManager, self).__init__(
            IndexedFile, IndexedFile.search())

    def construct_query(self, system, file_path=None):

        files_index_name = list(Index('des-files').get_alias().keys())[0]

        if system == settings.AGAVE_STORAGE_SYSTEM:
            storage_prefix_query = Q({'prefix': {'path._exact': '/' + self.username}})
        else:
            storage_prefix_query = Q({'prefix': {'path._exact': '/'}})

        private_files_query = Q(
            'bool',
            must=[
                Q({'term': {'_index': files_index_name}}),
                Q({'term': {'system._exact': system}}),
                storage_prefix_query,
                Q("query_string", query=self.query_string, default_operator="and", fields=['name', 'name._exact'])
            ],
            must_not=[
                Q({"prefix": {"path._exact": "/.Trash"}})
            ]
        )

        return private_files_query

    def listing(self, system, file_path, offset=0, limit=100, **kwargs):
        """Perform the search and output in a serializable format."""
        
        query = self.construct_query(system, file_path)
        listing_search = Search()
        listing_search = listing_search.query(query)
        listing_search = listing_search.extra(from_=offset, size=limit)
        res = listing_search.execute()
        
        children = []
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

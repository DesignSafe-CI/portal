"""
.. module: portal.apps.search.api.managers.private_data_search
   :synopsis: Manager handling My Data searches.
"""

from __future__ import unicode_literals, absolute_import
import logging
from designsafe.apps.api.search.searchmanager.base import BaseSearchManager
from designsafe.apps.data.models.elasticsearch import IndexedFile
from elasticsearch_dsl import Q, search, Index
from django.conf import settings

logger = logging.getLogger(__name__)


class SharedDataSearchManager(BaseSearchManager):
    """ Search manager handling Shared Data.
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

        super(SharedDataSearchManager, self).__init__(
            IndexedFile, IndexedFile.search())

    def construct_query(self, system, file_path=None):

        files_index_name = Index('des-files').get_alias().keys()[0]

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
                Q("query_string", query=self.query_string, default_operator="and")
            ],
            must_not=[
                Q({"prefix": {"path._exact": "/.Trash"}})
            ]
        )

        return private_files_query

    def listing(self, system, file_path, user_context=None, offset=None, limit=None):
        """Perform the search and output in a serializable format."""
        
        search = IndexedFile.search()
        search = search.filter("nested", path="permissions", query=Q("term", permissions__username=user_context))
        search = search.query("query_string", query=self.query_string, fields=["name", "name._exact", "keywords"])
        
        search = search.query(Q('bool', must_not=[Q({'prefix': {'path._exact': '/'+user_context}})]))
        search = search.filter("term", system=system)
        search = search.query(Q('bool', must_not=[Q({'prefix': {'path._exact': '{}/.Trash'.format(user_context)}})]))
        res = search.execute()

        children = []
        if res.hits.total:
            children = [o.to_dict() for o in search[offset:limit]]

        result = {
            'trail': [{'name': '$SEARCHSHARED', 'path': '/$SEARCH'}],
            'name': '$SEARCHSHARED',
            'path': '/$SEARCHSHARED',
            'system': system,
            'type': 'dir',
            'children': children,
            'permissions': 'READ'
        }
        return result



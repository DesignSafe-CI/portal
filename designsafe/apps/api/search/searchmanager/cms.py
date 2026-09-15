"""
.. module: portal.apps.api.search.searchmanager.cms
   :synopsis: Manager handling CMS searches.
"""


from django.conf import settings
from elasticsearch_dsl import Index, Q

from designsafe.apps.api.search.searchmanager.base import BaseSearchManager


class CMSSearchManager(BaseSearchManager):
    """ Search manager handling CMS data.
    """

    def __init__(self, request=None, **kwargs):
        if request:
            self.query_string = request.GET.get('query_string').replace("/", "\\/")
        else:
            self.query_string = kwargs.get('query_string').replace("/", "\\/")

        cms_index = Index('cms')

        self.sortFields = {
            'link': 'title_exact',
            'date': 'date'
        }

        super().__init__(cms_index, cms_index.search())

    def construct_query(self, system=None, file_path=None):
        cms_index_name = next(iter(Index(settings.ES_INDEX_PREFIX.format('cms')).get_alias().keys()))
        cms_query = Q(
            'bool',
            must=[
                Q({'term': {'_index': cms_index_name}}),
                Q("query_string",
                    query=self.query_string,
                    default_operator="and",
                    fields=['title', 'body'])
            ]
        )

        return cms_query

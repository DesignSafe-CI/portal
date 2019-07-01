"""
.. module: portal.apps.search.api.managers.cms_search
   :synopsis: Manager handling CMS searches.
"""

from __future__ import unicode_literals, absolute_import
import logging
from future.utils import python_2_unicode_compatible
from elasticsearch_dsl import Q, Index
from django.conf import settings
from designsafe.apps.api.search.searchmanager.base import BaseSearchManager

@python_2_unicode_compatible
class CMSSearchManager(BaseSearchManager):
    """ Search manager handling CMS data.
    """

    def __init__(self, request=None, **kwargs):
        if request:
            self.query_string = request.GET.get('query_string')
        else:
            self.query_string = kwargs.get('query_string')

        cms_index = Index('cms')

        self.sortFields = {
            'link': 'title_exact',
            'date': 'date'
        }

        super(CMSSearchManager, self).__init__(cms_index, cms_index.search())

    def construct_query(self, system=None, file_path=None):
        cms_query = Q(
            'bool',
            must=[
                Q({'term': {'_index': 'cms'}}),
                Q("query_string",
                    query=self.query_string,
                    default_operator="and",
                    fields=['title', 'body'])
            ]
        )

        return cms_query

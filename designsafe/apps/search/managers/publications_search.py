from designsafe.apps.search.managers.base import BaseSearchManager
from designsafe.apps.api.agave.filemanager.public_search_index import PublicationIndexed, LegacyPublicationIndexed
from elasticsearch_dsl import Q, Search

class PublicationsSearch(object):

    def __init__(self, query_string):
        self._query_string = query_string
        self._search = Search(index='des-publications_legacy,des-publications')

    def filter_keys(self, key):
        self._search = self._search.filter(Q({'term': {'project.value.keywords': key}}))
    
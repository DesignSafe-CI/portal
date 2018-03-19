import logging
import datetime
import os
import urllib2
from elasticsearch_dsl.query import Q, MultiMatch, Term
from designsafe.apps.data.models.elasticsearch import IndexedFile

#pylint: disable=invalid-name
logger = logging.getLogger(__name__)
#pylint: enable=invalid-name

class FileManager(object):
    """Elasticsearch File Manager Class"""
    def __init__(self, username):
        self.username = username

    def listing(self, system='designsafe.storage.default', path='/'):
        """Lists a file

        :param str system: System Id. Default: designsafe.storage.default
        :param str path: Path
        """
        search = IndexedFile.search()
        search.query(
            Q('bool',
              must=[
                  Q('term', **{'system':system}),
                  Q('term', **{'path._exact': path})
              ]),
            filter=Q('bool',
                     should=[
                         Q('term', **{'permissions.username':self.username}),
                         Q('term', **{'permissions.username': 'WORLD'})
                     ]
                    )
        )
        search = search.sort({'type': 'desc', 'name._exact': 'asc'})
        res = search.execute()
        return res, search

    def get(self, system='designsafe.storage.default', path='/', name=''):
        """Gets a file"""
        search = IndexedFile.search()
        search.query(
            Q('bool',
              must=[
                  Q('term', **{'system':system}),
                  Q('term', **{'path._exact': path}),
                  Q('term', **{'name._exact': name})
              ]),
            filter=Q('bool',
                     should=[
                         Q('term', **{'permissions.username':self.username}),
                         Q('term', **{'permissions.username': 'WORLD'})
                     ]
                    )
        )
        search = search.sort({'type': 'desc', 'name._exact': 'asc'})
        res = search.execute()
        return res, search

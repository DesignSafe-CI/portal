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

    def _pems_filter(self):
        term_username_query = Q('term', **{'permissions.username': self.username})
        term_world_query = Q('term', **{'permissions.username': 'WORLD'})
        bool_query = Q('bool')
        bool_query.should = [term_username_query, term_world_query]
        nested_query = Q('nested')
        nested_query.path = 'permissions'
        nested_query.query = bool_query
        return nested_query

    def listing(self, system='designsafe.storage.default', path='/'):
        """Lists a file

        :param str system: System Id. Default: designsafe.storage.default
        :param str path: Path
        """
        logger.debug('listing %s', os.path.join(system, path))
        search = IndexedFile.search()
        term_system_query = Q('term', **{'system._exact':system})
        term_path_query = Q('term', **{'path._exact': path})
        bool_query = Q('bool')
        bool_query.must = [term_system_query, term_path_query]
        bool_query.filter = self._pems_filter()
        search = search.query(bool_query)
        search = search.sort({'name._exact': 'asc'})
        res = search.execute()
        logger.debug('res %s', str(res.hits.total))
        return res, search

    def listing_recursive(self, system='designsafe.storage.default', path='/'):
        """Lists every folder's children"""
        search = IndexedFile.search()
        term_system_query = Q('term', **{'system._exact':system})
        term_path_query = Q('term', **{'path._path': path})
        bool_query = Q('bool')
        bool_query.must = [term_system_query, term_path_query]
        bool_query.filter = self._pems_filter()
        search = search.query(bool_query)
        search = search.sort({'name._exact': 'asc'})
        res = search.execute()
        return res, search

    def get(self, system='designsafe.storage.default', path='/', name=''):
        """Gets a file"""
        search = IndexedFile.search()
        term_system_query = Q('term', **{'system._exact':system})
        term_path_query = Q('term', **{'path._exact': path})
        term_username_query = Q('term', **{'name._exact': name})
        bool_query = Q('bool')
        bool_query.must = [
            term_system_query,
            term_path_query,
            term_username_query
        ]
        bool_query.filter = self._pems_filter()
        search = search.query(bool_query)
        search = search.sort({'name._exact': 'asc'})
        res = search.execute()
        return res, search

    def index(self, file_object, pems):
        """Indexes an Agave response file object (json) to an IndexedFile"""
        res, search = self.get(file_object.system,
                               os.path.dirname(file_object.path.strip('/')),
                               os.path.basename(file_object.path.strip('/')))
        if res.hits.total > 1:
            for doc in res[1:]:
                doc.delete()
        if res.hits.total >= 1:
            document = res[0]
            file_object.pop('_links')
            file_object.pop('permissions')
            document.update(**file_object)
        else:
            document = IndexedFile(
                name=os.path.basename(file_object.path.strip('/')),
                path=os.path.dirname(file_object.path.strip('/')) or '/',
                lastModified=file_object.lastModified.isoformat(),
                length=file_object.length,
                format=file_object.format,
                mimeType=file_object.mimeType,
                type=file_object.type,
                system=file_object.system,
            )
            if pems is None or not pems:
                document.permissions = [{
                    'username': self.username,
                    'permission': {
                        'read': True,
                        'write': True,
                        'execute': True
                    }
                }]
            document.save()

        if pems:
            for pem in pems:
                pem.pop('_links', None)
                pem.pop('internalUsername', None)
            document.update(permissions=pems)
        return document

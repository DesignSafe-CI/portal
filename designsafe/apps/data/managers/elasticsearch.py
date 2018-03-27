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
        logger.debug('listing %s', os.path.join(system, path))
        search = IndexedFile.search()
        search = search.query(
            Q('bool',
              must=[
                  Q('term', **{'system._exact':system}),
                  Q('term', **{'path._exact': path})
              ],
              filter=Q('bool',
                       should=[
                           Q('term', **{'permissions.username':self.username}),
                           Q('term', **{'permissions.username': 'WORLD'})
                       ]
                      )
            )
        )
        search = search.sort({'name._exact': 'asc'})
        res = search.execute()
        logger.debug('res %s', str(res.hits.total))
        return res, search

    def listing_recursive(self, system='designsafe.storage.default', path='/'):
        """Lists every folder's children"""
        search = IndexedFile.search()
        search = search.query(
            Q('bool',
              must=[
                  Q('term', **{'system._exact':system}),
                  Q('term', **{'path._path': path})
              ],
              filter=Q('bool',
                       should=[
                           Q('term', **{'permissions.username':self.username}),
                           Q('term', **{'permissions.username': 'WORLD'})
                       ]
                      )
             )
        )
        search = search.sort({'name._exact': 'asc'})
        res = search.execute()
        return res, search

    def get(self, system='designsafe.storage.default', path='/', name=''):
        """Gets a file"""
        search = IndexedFile.search()
        search = search.query(
            Q('bool',
              must=[
                  Q('term', **{'system._exact':system}),
                  Q('term', **{'path._exact': path}),
                  Q('term', **{'name._exact': name})
              ],
              filter=Q('bool',
                       should=[
                           Q('term', **{'permissions.username':self.username}),
                           Q('term', **{'permissions.username': 'WORLD'})
                       ]
                      )
             )
        )
        search = search.sort({'name._exact': 'asc'})
        res = search.execute()
        return res, search

    def index(self, file_object, pems):
        """Indexes an Agave response file object (json) to an IndexedFile"""
        res, search = self.get(file_object.system,
                               os.path.dirname(file_object.path),
                               os.path.basename(file_object.path))
        if res.hits.total > 1:
            for doc in res[1:]:
                doc.delete()
        if res.hits.total >= 1:
            document = res[0]
            document.update(**file_object)
        else:
            document = IndexedFile(
                name=os.path.basename(file_object.path),
                path=os.path.dirname(file_object.path).strip('/') or '/',
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
            else:
                pems.pop('_links', None)
                pems.pop('internalUsername', None)
            document.save()

        if pems:
            document.update(permissions=pems)
        return document

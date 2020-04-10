"""File Manager for legacy Shared with Me data
"""

import logging
import os
from designsafe.apps.api.agave.filemanager.agave import AgaveFileManager
from elasticsearch import TransportError, ConnectionTimeout
from elasticsearch_dsl.query import Q
from designsafe.apps.data.models.elasticsearch import IndexedFile
logger = logging.getLogger(__name__)


class SharedDataFileManager(AgaveFileManager):
    NAME = 'agave'
    DEFAULT_SYSTEM_ID = 'designsafe.storage.default'

    @property
    def requires_auth(self):
        """Whetherit should check for an authenticated user.

        If this is a public data file manager, it should return False.
        """
        return True

    @staticmethod
    def listing(system, file_path, user_context=None, offset=None, limit=None):
        file_path = file_path or '/'
        file_path = file_path.strip('/')
        if file_path.strip('/').split('/')[0] != user_context:
            if file_path == '$SHARE':
                q = Q('bool',
                      must=[
                          Q('term', **{'system._exact': system})
                      ]
                      )
            else:
                q = Q('bool',
                      must=[
                          Q('term', **{'path._path': file_path}),
                          Q('term', **{'system._exact': system})
                      ]
                      )
        else:
            q = Q('bool',
                  must=[
                      Q('term', **{'path._exact': file_path}),
                      Q('term', **{'system._exact': system})
                  ]
                  )
        if user_context is not None:
            username_q = Q('term', **{'permissions.username': user_context})
            world_q = Q('term', **{'permissions.username': 'WORLD'})
            pems_filter = Q('bool')
            pems_filter.should = [username_q, world_q]
            nested_filter = Q('nested')
            nested_filter.path = 'permissions'
            nested_filter.query = pems_filter

        if file_path == '$SHARE':
            file_path = '/'
            home_filter = Q('bool', must_not=Q('term', **{'path._path': '/' + user_context}))
            query = Q('bool', must=q, filter=[nested_filter, home_filter])
        else:
            query = Q('bool', must=q)

        search = IndexedFile.search()
        search.query = query
        search = search.sort('path._exact', 'name._exact')

        try:
            res = search.execute()
        except (TransportError, ConnectionTimeout) as e:
            if getattr(e, 'status_code', 500) == 404:
                raise
            res = search.execute()

        if file_path == '/':
            result = {
                'trail': [{'name': '$SHARE', 'path': '/$SHARE'}],
                'name': '$SHARE',
                'path': '/$SHARE',
                'system': system,
                'type': 'dir',
                'children': [],
                'permissions': 'NONE'
            }
        else:
            file_path_comps = file_path.split('/')
            if file_path_comps != '':
                file_path_comps.insert(0, '')

            trail_comps = [{'name': file_path_comps[i] or '/',
                            'system': system,
                            'path': '/'.join(file_path_comps[0:i + 1]) or '/',
                            } for i in range(0, len(file_path_comps))]
            result = {
                'trail': trail_comps,
                'name': os.path.split(file_path)[1],
                'path': file_path,
                'system': system,
                'type': 'dir',
                'children': [],
                'permissions': 'READ'
            }

        for f in res:
            result['children'].append(f.to_dict())

        return result

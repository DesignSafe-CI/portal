import logging
import os
import six
from itertools import takewhile
from django.conf import settings
from elasticsearch import TransportError
from elasticsearch_dsl.query import Q
from elasticsearch_dsl import Search, DocType
from elasticsearch_dsl.connections import connections
from .base import BaseFileManager


logger = logging.getLogger(__name__)

try:
    es_settings = getattr(settings, 'ELASTIC_SEARCH', {})
    default_index = es_settings['default_index']
    cluster = es_settings['cluster']
    hosts = cluster['hosts']
    connections.configure(
        default={
            'hosts': hosts,
            'sniff_on_start': True,
            'sniff_on_connection_fail': True,
            'sniffer_timeout': 60,
            'retry_on_timeout': True,
            'timeout:': 20,
        })
except KeyError as e:
    logger.exception('ELASTIC_SEARCH missing %s' % e)

def merge_file_paths(system, user_context, file_path, s):
    def _names_equal(name):
        return all(n == name[0] for n in name[1:])

    def _common_prefix(paths):
        levels = zip(*[os.path.join(p.path.strip('/'), p.name).split('/') for p in paths])
        return '/'.join(x[0] for x in takewhile(_names_equal, levels))

    listing = []
    if not s.count():
        return []

    file_path_comps = file_path.strip('/').split('/')
    if file_path == '/' or file_path == '':
        lfp = 1
    else:
        lfp = len(file_path_comps) + 1

    common_paths = {}
    for doc in s.scan():
        owner = os.path.join(doc.path, doc.name).strip('/').split('/')[0]
        full_path = os.path.join(doc.path, doc.name)
        if owner == user_context or full_path.strip('/') == file_path:
            continue


        common_path = '/'.join(full_path.split('/')[:lfp])
        if common_path not in common_paths:
            common_paths[common_path] = [doc]
        else:
            common_paths[common_path].append(doc)

    for key, val in six.iteritems(common_paths):
        logger.debug('key %s', key)
        #If only one children on the common path key
        #then it's supposed to show on the listing
        if len(val) == 1:
            listing += val
            continue

        common_prefix = _common_prefix(val)
        #If they don't have a common prefix or the level of the common_prefix is the same
        #as the file_path being listed then they're all on the same level
        #and are children of the listing
        if not common_prefix:
            listing += val
            continue
        #Add the common_prefix document to the listing.
        #As long as it's valid.
        d = Object(system, common_prefix.split('/')[0], common_prefix)._wrap
        if d:
            listing.append(d)

    return listing 

class IndexedFile(DocType):

    class Meta:
        index = default_index
        doc_type = 'objects'

class Object(object):
    def __init__(self, system_id, user_context, file_path):
        self.indexed_file = IndexedFile()
        s = IndexedFile.search()
        path, name = os.path.split(file_path)
        path = path or '/'
        q = Q('filtered', 
            query = Q('bool',
                    must = [
                      Q({'term': {'path._exact': path}}),
                      Q({'term': {'name._exact': name}})
                    ]),
            filter = Q('bool', 
                must = [
                    Q({'term': {'permissions.username': user_context}}),
                    Q({'term': {'deleted': False}}),
                    Q({'term': {'systemId': system_id}})
            ]))
        s.query = q
        try:
            res = s.execute()
        except TransportError as e:
            if e.status_code == 404:
                raise
            res = s.execute()
        
        if res.hits.total:
            self._wrap = res[0]
        else:
            self._wrap = None

    def to_dict(self):
        return self._wrap.to_dict()
    
class ElasticFileManager(BaseFileManager):
    def __init__(self):
        super(ElasticFileManager, self).__init__()
    
    @staticmethod
    def listing(system, file_path, user_context):
        file_path = file_path or '/'
        file_path = file_path.strip('/')
        if file_path.strip('/').split('/')[0] != user_context:
            q = Q('bool', must = Q({'term': {'path._path': file_path}}))
        else:    
            q = Q('bool', must = Q({'term': {'path._exact': file_path}}))
        filter_parts = [
            Q({'term': {'systemId': system}}),
            Q({'term': {'deleted': False}})
        ]
        if user_context is not None:
            filter_parts.append(Q({'term': {'permissions.username': user_context}}))
        f = Q('bool', must=filter_parts)

        if file_path == '$SHARE':
            file_path = '/'
            query = Q('filtered', filter=f)
        else:
            query = Q('filtered', query=q, filter=f)

        search = IndexedFile.search()
        search.query = query
        search = search.sort('path._path', 'name._exact')

        logger.debug('Query: {}'.format(search.to_dict()))

        try:
            res = search.execute()
        except TransportError as e:
            if e.status_code == 404:
                raise
            res = search.execute()
        
        listing = merge_file_paths(system, user_context, file_path, search)
        
        if file_path == '/':
            result = {
                'trail': [{'name': '$SHARE', 'path': '/$SHARE'}],
                'name': '$SHARE',
                'path': '/$SHARE',
                'system': system,
                'type': 'dir',
                'children': []
            }
        else:
            file_path_comps = file_path.split('/')
            if file_path_comps != '':
                file_path_comps.insert(0, '')

            trail_comps = [{'name': file_path_comps[i] or '/',
                            'system': system,
                            'path': '/'.join(file_path_comps[0:i+1]) or '/',
                           } for i in range(0, len(file_path_comps))]
            result = {
                'trail': trail_comps,
                'name': os.path.split(file_path)[1],
                'path': file_path,
                'system': system,
                'type': 'dir',
                'children': []
            }

        for f in listing:
            result['children'].append(f.to_dict())
        return result

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
        #If only one children on the common path key
        #then it's supposed to show on the listing
        if len(val) == 1:
            listing += [Object(wrap=indexed) for indexed in val]
            continue

        common_prefix = _common_prefix(val)
        #If they don't have a common prefix or the level of the common_prefix is the same
        #as the file_path being listed then they're all on the same level
        #and are children of the listing
        if not common_prefix:
            listing += [Object(wrap=indexed) for indexed in val]
            continue
        #Add the common_prefix document to the listing.
        #As long as it's valid.
        d = Object(system, common_prefix.split('/')[0], common_prefix)
        if d._wrap:
            listing.append(d)

    return listing 

class IndexedFile(DocType):

    class Meta:
        index = default_index
        doc_type = 'objects'

class Object(object):
    def __init__(self, system_id = None, user_context = None, 
                 file_path = None, wrap = None, *args, **kwargs):
        if wrap is not None:
            self._wrap = wrap
        else:
            s = IndexedFile.search()
            path, name = os.path.split(file_path)
            path = path.strip('/') or '/'
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
            logger.debug('serach query: {}'.format(s.to_dict()))
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

    def success(self):
        if self._wrap:
            return True
        
        return False

    def update_metadata(self, meta_obj):
        """Update metadata of an object

        The matadata this method updates is only the user metadata.
        This first version only focuses on **keywords**.
        This metadata should grow in the future.

        :param obj meta_obj: object with which the document will be updated

        .. warning:: This method blindly replaces the data in the
            saved document. The only sanitization it does is to remove
            repeated elements.
        """

        keywords = list(set(meta_obj['keywords']))
        keywords = [kw.strip() for kw in keywords]
        self._wrap.update(keywords=keywords)
        self._wrap.save()
        return self

    def user_pems(self, user_context):
        """Converts from ES pems to user specific pems

        When doing an agave file listing the permissions returned
        represent the permissions for the requesting user on that
        specific file. The permissions that are indexed in the
        ES index is the result of doing a permissions listing on the file
        which results on an array of permissions for EVERY user that
        has any type of permission on that file. This function is in
        charge of doing that conversion.
        
        ..example:: ES indexed permissions:
            ``{
                'permissions: [ 
                { 'username': 'my_user',
                  'permission': {
                    'read': 'true',
                    'write': 'true',
                    'execute': 'true'
                }
                  'recursive': 'true'
              ]``
              Agave file listing permissions:
            `` 'permissions': 'ALL' ``
        """
        pems = [pem for pem in self._wrap.permissions if \
                pem['username'] == user_context]
        if not pems:
            return 'NONE'
        
        pem = pems[0]
        user_pem = ''
        if pem['permission']['read']:
            user_pem += 'READ_'
        if pem['permission']['write']:
            user_pem += 'WRITE_'
        if pem['permission']['execute']:
            user_pem += 'EXECUTE_'

        user_pem = user_pem.strip('_')
        if user_pem == 'RED_WRITE_EXECUTE':
            user_pem = 'ALL'

        return user_pem

    def to_dict(self, user_context=None):
        file_dict = self._wrap.to_dict()
        if user_context:
            file_dict['permissions'] = self.user_pems(user_context)
        
        file_dict['path'] = os.path.join(self._wrap.path, self._wrap.name)
        file_dict['system'] = self._wrap['systemId']
        return file_dict
        
    
class ElasticFileManager(BaseFileManager):
    NAME = 'agave'
    DEFAULT_SYSTEM_ID = 'designsafe.storage.default'

    def __init__(self):
        super(ElasticFileManager, self).__init__()

    def get(self, system, file_path, user_context):
        file_object = Object(system_id=system, user_context=user_context,
                             file_path=file_path)
        if file_object.success():
            return file_object
        
        return None
    
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
                'children': [],
                'permissions': 'NONE'
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
                'children': [],
                'permissions': 'READ'
            }

        for f in listing:
            result['children'].append(f.to_dict(user_context=user_context))
        return result

    def search(self, system, username, query_string,
               file_path=None, offset=0, limit=100):
        
        search = IndexedFile.search()
        query = Q('filtered',
                  filter=Q('bool',
                           must=[Q({'term': {'systemId': system}}),
                                 Q({'term': {'permissions.username': username}}),
                                 Q({'prefix': {'path._exact': username}})],
                           must_not=[Q({'prefix': {'path._exact': '{}/.Trash'.format(username)}})]),
                   query=Q({'simple_query_string':{
                            'query': query_string,
                            'fields': ['name', 'name._exact', 'keywords']}}))
        search.query = query
        res = search.execute()
        children = []
        if res.hits.total:
            children = [Object(wrap=o).to_dict() for o in search[offset:limit]]

        result = {
            'trail': [{'name': '$SEARCH', 'path': '/$SEARCH'}],
            'name': '$SEARCH',
            'path': '/$SEARCH',
            'system': system,
            'type': 'dir',
            'children': children,
            'permissions': 'READ'
        }
        return result

    def search_shared(self, system, username, query_string,
               file_path=None, offset=0, limit=100):
        
        search = IndexedFile.search()
        query = Q('filtered',
                  filter=Q('bool',
                           must=[Q({'term': {'systemId': system}}),
                                 Q({'term': {'permissions.username': username}})],
                           must_not=[Q({'prefix': {'path._exact': '{}/.Trash'.format(username)}}),
                                     Q({'prefix': {'path._exact': username}})]),
                   query=Q({'simple_query_string':{
                            'query': query_string,
                            'fields': ['name', 'name._exact', 'keywords']}}))
        search.query = query
        res = search.execute()
        children = []
        if res.hits.total:
            children = [Object(wrap=o).to_dict() for o in search[offset:limit]]

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

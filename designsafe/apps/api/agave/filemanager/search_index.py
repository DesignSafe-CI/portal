import logging
import os
import six
import json
from itertools import takewhile
from django.conf import settings
from django.contrib.auth import get_user_model
from designsafe.apps.api.projects.models import Project
from elasticsearch import TransportError, ConnectionTimeout
from elasticsearch_dsl.query import Q
from elasticsearch_dsl import Search, DocType
from elasticsearch_dsl.connections import connections
from .base import BaseFileManager


logger = logging.getLogger(__name__)

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
    logger.debug('length: %d', len(listing))
    return listing

class IndexedFile(DocType):

    class Meta:
        index = 'des-files'
        doc_type = 'file'

class Object(object):
    def __init__(self, system_id = None, user_context = None,
                 file_path = None, wrap = None, *args, **kwargs):
        if wrap is not None:
            self._wrap = wrap
        else:
            s = IndexedFile.search()
            path, name = os.path.split(file_path)
            path = path.strip('/') or '/'
            path_q = Q('term', **{'path._exact': path})
            name_q = Q('term', **{'name._exact': name})
            system_q = Q('term', **{'system._exact': system_id})
            query = Q('bool')
            query.must = [
                path_q,
                name_q,
                system_q
            ]
            # pems filter
            user_pem_q = Q('term', **{'permissions.username': user_context})
            world_pem_q = Q('term', **{'permissions.username': 'WORLD'})
            bool_filter = Q('bool')
            bool_filter.should = [
                user_pem_q,
                world_pem_q
            ]
            nested_filter = Q('nested')
            nested_filter.path = 'permissions'
            nested_filter.query = bool_filter
            # set filter
            query.filter = nested_filter
            s = s.query(query)
            logger.debug('serach query: %s', json.dumps(s.to_dict(), indent=4))
            try:
                res = s.execute()
            except (TransportError, ConnectionTimeout) as e:
                if getattr(e, 'status_code', 500) == 404:
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

    def user_pems(self, user_context = None):
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
        logger.debug(getattr(self._wrap, 'permissions', {'username': ''}))
        logger.debug(user_context)
        if user_context:
            pems = [pem for pem in getattr(self._wrap, 'permissions', {'username': ''}) if \
                    pem['username'] == user_context]
            logger.debug(pems)
        else:
            pems = [pem for pem in getattr(self._wrap, 'permissions', {'username': ''})] 
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
        if user_pem == 'READ_WRITE_EXECUTE':
            user_pem = 'ALL'

        return user_pem

    def to_dict(self, user_context=None):
        file_dict = self._wrap.to_dict()
        logger.debug(file_dict['name'])
        logger.debug(file_dict['permissions'])
        #if user_context:
        file_dict['permissions'] = self.user_pems(user_context)
        #elif file_dict['system'] == 'designsafe.storage.community':
        #    file_dict['permissions'] = "ALL"
        file_dict['path'] = os.path.join(self._wrap.path, self._wrap.name)
        file_dict['system'] = self._wrap['system']
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
            home_filter = Q('bool', must_not=Q('term', **{'path._path': user_context}))
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

        listing = merge_file_paths(system, user_context, file_path, search)
        logger.debug(file_path)
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
        #logger.debug(result['permissions'])
        return result

    def search(self, system, username, query_string,
               file_path=None, offset=0, limit=100):
        """
        Executes a search in for files belonging to the logged-in user and 
        returns a result dict to be passed to the front-end.

        :param system: Agave filesystem to search (should be designsafe.storage.default)
        :param username: username of the logged-in user.
        :param query_string: user's query to pass to elasticsearch
        :param file_path: unused here
        :param offset: elasticsearch offset
        :param limit: number of search hits to return

        """
        split_query = query_string.split(" ")
        for i, c in enumerate(split_query):
            if c.upper() not in ["AND", "OR", "NOT"]:
                split_query[i] = "*" + c + "*"
        
        query_string = " ".join(split_query)

        logger.debug(query_string)

        search = IndexedFile.search()
        search = search.filter("nested", path="permissions", query=Q("term", permissions__username=username))
        
        search = search.query(Q('bool', must=[Q({'prefix': {'path._exact': username}})]))
        search = search.filter(Q({'term': {'system._exact': system}}))
        search = search.query(Q('bool', must_not=[Q({'prefix': {'path._exact': '{}/.Trash'.format(username)}})]))
        search = search.query("query_string", query=query_string, fields=["name", "name._exact", "keywords"])
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

    def search_community(self, system, query_string,
               file_path=None, offset=0, limit=100):
        """
        Executes a search in community data and returns a dict with the results
        and information needed by the front-end for formatting.

        :param system: Agave filesystem to search (should be designsafe.storage.community)
        :param username: username of the logged-in user.
        :param query_string: user's query to pass to elasticsearch
        :param file_path: unused here
        :param offset: elasticsearch offset
        :param limit: number of search hits to return
        """
        
        split_query = query_string.split(" ")
        for i, c in enumerate(split_query):
            if c.upper() not in ["AND", "OR", "NOT"]:
                split_query[i] = "*" + c + "*"
        
        query_string = " ".join(split_query)

        logger.debug(query_string)
        filters = Q('term', system="designsafe.storage.community") #| \
                  #Q('term', system="designsafe.storage.published") | \
                  #Q('term', system="designsafe.storage.community")
        search = IndexedFile.search()\
            .query("query_string", query=query_string, fields=["name", "name._exact", "keywords"])\
            .filter(filters)\
            .extra(from_=offset, size=limit)
            #.filter("term", type="file")\
           


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


    def search_in_project(self, system, query_string, file_path=None, offset=0, limit=100):
        """
        Performs a search for files within a specific project.
        """
        
        split_query = query_string.split(" ")
        for i, c in enumerate(split_query):
            if c.upper() not in ["AND", "OR", "NOT"]:
                split_query[i] = "*" + c + "*"
        
        query_string = " ".join(split_query)

        logger.debug(query_string)

        search = IndexedFile.search()
        # search = search.filter("nested", path="permissions", query=Q("term", permissions__username=username))
        
        # search = search.query(Q('bool', must=[Q({'prefix': {'path._exact': username}})]))
        search = search.filter(Q({'term': {'system._exact': system}}))
        # search = search.query(Q('bool', must_not=[Q({'prefix': {'path._exact': '{}/.Trash'.format(username)}})]))
        search = search.query("query_string", query=query_string, fields=["name", "name._exact", "keywords"])
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

    def search_projects(self, username, query_string, file_path=None, offset=0, limit=100):
        user = get_user_model().objects.get(username=username)
        ag = user.agave_oauth.client

        projects = Project.list_projects(agave_client=ag)

        split_query = query_string.split(" ")
        for i, c in enumerate(split_query):
            if c.upper() not in ["AND", "OR", "NOT"]:
                split_query[i] = "*" + c + "*"
        
        query_string = " ".join(split_query)

        children = []
        for project in projects:

            search = IndexedFile.search()\
                .query("query_string", query=query_string, fields=["name", "name._exact", "keywords"])\
                .filter(Q({'term': {'system._exact': 'project-' + project.uuid}}))\
                .extra(from_=offset, size=limit)
            
            res = search.execute()
            
            if res.hits.total:
                for o in search[offset:limit]:
                    child = Object(wrap=o).to_dict()
                    child.update({'title': project.title})
                    children.append(child)

        result = {
            'trail': [{'name': '$SEARCH', 'path': '/$SEARCH'}],
            'name': '$SEARCH',
            'path': '/$SEARCH',
            'system': 'designsafe.projects',
            'type': 'dir',
            'children': children,
            'permissions': 'READ'
        }

        return result

    def search_shared(self, system, username, query_string,
               file_path=None, offset=0, limit=100):
        """
        search = IndexedFile.search()
        query = Q('bool',
                  filter=Q('bool',
                           must=[Q({'term': {'systemId': system}}),
                                 Q({'term': {'permissions.username': username}})],
                           must_not=[Q({'prefix': {'path._exact': '{}/.Trash'.format(username)}}),
                                     Q({'prefix': {'path._exact': username}})]),
                   must=Q({'query_string':{
                            'query': query_string,
                            'fields': ['name', 'name._exact', 'keywords']}}))
        search.query = query
        res = search.execute()
        """

        split_query = query_string.split(" ")
        for i, c in enumerate(split_query):
            if c.upper() not in ["AND", "OR", "NOT"]:
                split_query[i] = "*" + c + "*"
        
        query_string = " ".join(split_query)

        search = IndexedFile.search()
        search = search.filter("nested", path="permissions", query=Q("term", permissions__username=username))
        search = search.query("query_string", query=query_string, fields=["name", "name._exact", "keywords"])
        
        search = search.query(Q('bool', must_not=[Q({'prefix': {'path._exact': username}})]))
        search = search.filter("term", system=system)
        search = search.query(Q('bool', must_not=[Q({'prefix': {'path._exact': '{}/.Trash'.format(username)}})]))
        res = search.execute()

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

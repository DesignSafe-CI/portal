"""File Manager for published data. api/published-data/*

    This is a separate file manager because published data gets handled
    so much different than the rest of the data. Most of the time the requests
    will look the same e.g. `listing` request, `metadata view` request. The
    difference is in how the response is constructed. Most of the time published
    data has more metadata linked to it than private data. Also, published data
    might come from different external resources."""

import logging
import json
import os
import re
import datetime
import itertools
from django.conf import settings
from elasticsearch import TransportError, ConnectionTimeout
from elasticsearch_dsl import Search, DocType
from elasticsearch_dsl.query import Q
from elasticsearch_dsl.connections import connections
from .base import BaseFileManager
from designsafe.apps.api.agave.filemanager.agave import  AgaveFileManager

logger = logging.getLogger(__name__)


class PublicationIndexed(DocType):
    class Meta:
        index = settings.ES_INDICES['publications']['alias']
        doc_type = settings.ES_INDICES['publications']['documents'][0]['name']

class Publication(object):
    def __init__(self, wrap=None, project_id=None, *args, **kwargs):
        if wrap is not None:
            if isinstance(wrap, PublicationIndexed):
                self._wrap = wrap
            else:
                s = PublicationIndexed.search()
                s.query = Q({"term":
                              {"projectId.keyword": wrap['projectId']}
                            })
                try:
                    res = s.execute()
                except (TransportError, ConnectionTimeout) as e:
                    if getattr(e, 'status_code', 500) == 404:
                        raise
                    res = s.execute()
                if res.hits.total:
                    self._wrap = res[0]
                    for exp in getattr(self._wrap, 'experimentsList', []):
                        doi = getattr(exp, 'doi')
                        if not doi:
                            continue

                        experiment = filter(
                            lambda x: x['uuid'] == exp.uuid,
                            wrap.get('experimentsList', [])
                        )
                        if not len(experiment):
                            continue

                        experiment[0]['doi'] = doi

                    self._wrap.update(**wrap)
                else:
                    self._wrap = PublicationIndexed(**wrap)

        elif project_id is not None:
            s = PublicationIndexed.search()
            s.query = Q({"term": {"projectId.keyword": project_id }})
            logger.debug('p serach query: {}'.format(s.to_dict()))
            try:
                res = s.execute()
            except (TransportError, ConnectionTimeout) as e:
                if getattr(e, 'status_code', 500) == 404:
                    raise
                res = s.execute()

            if res.hits.total:
                self._wrap = res[0]
            else:
                self._wrap = PublicationIndexed(projectId=project_id)
        else:
            self._wrap = PublicationIndexed()

    @classmethod
    def listing(cls, status='published'):
        list_search = PublicSearchManager(cls,
                                          PublicationIndexed.search(),
                                          page_size=100)
        list_search._search.query = Q(
            "bool",
            must=[
                Q({'term': {'status': status}})
            ]
            )
        list_search.sort({'created': {'order': 'desc'}})

        return list_search.results(0)

    @property
    def id(self):
        return self._wrap.meta.id

    def save(self, **kwargs):
        self._wrap.save(**kwargs)
        return self

    def to_dict(self):
        return self._wrap.to_dict()

    def to_file(self):
        dict_obj = {'agavePath': 'agave://designsafe.storage.published/{}'.\
                                 format(self.project.value.projectId),
                     'children': [],
                     'deleted': False,
                     'format': 'folder',
                     'length': 24731027,
                     'meta': {
                         'title': self.project['value']['title'],
                         'pi': self.project['value']['pi'],
                         'dateOfPublication': self.created,
                         'type': self.project['value']['projectType'],
                         'projectId': self.project['value']['projectId'],
                         'keywords': self.project['value']['keywords'],
                         'description': self.project['value']['description']
                         },
                     'name': self.project.value.projectId,
                     'path': '/{}'.format(self.project.value.projectId),
                     'permissions': 'READ',
                     'project': self.project.value.projectId,
                     'system': 'designsafe.storage.published',
                     'systemId': 'designsafe.storage.published',
                     'type': 'dir'}
        pi = self.project['value']['pi']
        pi_user = filter(lambda x: x['username'] == pi, self.users)
        if pi_user:
            pi_user = pi_user[0]
            dict_obj['meta']['piLabel'] = '{last_name}, {first_name}'.format(
                last_name=pi_user['last_name'], first_name=pi_user['first_name'])
        return dict_obj

    def related_file_paths(self):
        dict_obj = self._wrap.to_dict()
        related_objs = []
        if dict_obj['project']['value']['projectType'] == 'experimental':
            related_objs = (
                dict_obj.get('modelConfigs', []) +
                dict_obj.get('analysisList', []) +
                dict_obj.get('sensorLists', []) +
                dict_obj.get('eventsList', []) +
                dict_obj.get('reportsList', [])
            )
        elif dict_obj['project']['value']['projectType'] == 'simulation':
            related_objs = (
                dict_obj.get('models', []) +
                dict_obj.get('inputs', []) +
                dict_obj.get('outputs', []) +
                dict_obj.get('analysiss', []) +
                dict_obj.get('reports', [])
            )

        file_paths = []
        proj_sys = 'project-{}'.format(dict_obj['project']['uuid'])
        for obj in related_objs:
            file_paths += obj['_filePaths']

        return file_paths

    def __getattr__(self, name):
        val = getattr(self._wrap, name, None)
        if val:
            return val
        else:
            raise AttributeError('\'Publication\' has no attribute \'{}\''.format(name))

class LegacyPublicationIndexed(DocType):
   class Meta:
        index = settings.ES_INDICES['publications_legacy']['alias']
        doc_type = settings.ES_INDICES['publications_legacy']['documents'][0]['name'] 

class LegacyPublication(object):

    def __init__(self, wrap=None, nees_id=None, *args, **kwargs):
        self._wrap = LegacyPublicationIndexed()
        if wrap is not None and isinstance(wrap, LegacyPublicationIndexed):
            self._wrap = wrap

        if nees_id is not None:
            s = LegacyPublicationIndexed.search()
            s.query = Q({"term": {"name._exact": nees_id}})
            try:
                res = s.execute()
            except (TransportError, ConnectionTimeout) as e:
                if getattr(e, 'status_code', 500) == 404:
                    raise
                res = s.execute()
            if res.hits.total:
                self._wrap = res[0]

    def to_dict(self):
        return self._wrap.to_dict()

    @classmethod
    def listing(cls, offset, limit):
        list_search = PublicSearchManager(cls, LegacyPublicationIndexed.search(), page_size=limit)
        # list_search._search.query = Q(None)
        list_search.sort({'project._exact': 'asc'})
        return list_search.results(offset)

    def to_file(self):
        publication_dict = self._wrap.to_dict()

        project_dict = {}
        for key in ['deleted', 'description', 'endDate', 'facility', 'name', 
            'organization', 'pis', 'project', 'projectPath', 'publications',
            'startDate', 'system', 'title', 'sponsor']:
            
            if key in publication_dict:
                project_dict[key] = publication_dict[key]

        project_dict['systemId'] = publication_dict['system']

        experiments = []
        if 'experiments' in publication_dict:
            experiments = publication_dict['experiments']

        dict_obj = {'agavePath': 'agave://nees.public/{}'.\
                                 format(self.path),
                     'children': [],
                     'deleted': False,
                     'format': 'folder',
                     'length': 24731027,
                     'name': project_dict['name'],
                     'path': '/{}'.format(self.path),
                     'permissions': 'READ',
                     # project': project_dict['project'],
                     'system': project_dict['system'],
                     'systemId': project_dict['system'],
                     'type': 'dir',
                     'metadata': {
                         'experiments': experiments,
                         'project': project_dict
                     }}
                
        return dict_obj
    
    def __getattr__(self, name):
        val = getattr(self._wrap, name, None)
        if val:
            return val
        else:
            return 'N/A'
    
class CMSIndexed(DocType):
    class Meta:
        index = 'cms'

class PublicFullIndexed(DocType):
    class Meta:
        index = 'nees'
        doc_type = '_all'

class PublicProjectIndexed(DocType):
    class Meta:
        index = 'nees'
        doc_type = 'project'

class PublicExperimentIndexed(DocType):
    class Meta:
        index = 'nees'
        doc_type = 'experiment'

class PublicObjectIndexed(DocType):
    class Meta:
        index = 'nees'
        doc_type = 'object'


class PublicSearchManager(object):
    """ Wraps elastic search result object

        This class wraps the elasticsearch result object
        to add extra functionality"""

    def __init__(self, doc_class, search, page_size=100):
        self._doc_class = doc_class
        self._search = search
        self._page_size = page_size

    def count(self):
        return self._search.count()

    def source(self, **kwargs):
        self._search = self._search.source(**kwargs)
        return self._search

    def filter(self, *args, **kwargs):
        self._search = self._search.filter(*args, **kwargs)
        return self._search

    def sort(self, *keys):
        self._search = self._search.sort(*keys)
        return self

    def execute(self):
        try:
            res = self._search.execute()
        except (TransportError, ConnectionTimeout) as err:
            if getattr(err, 'status_code', 500) == 404:
                raise
            res = self._search.execute()

        return res

    def all(self):
        res = self._search.execute()
        if res.success() and res.hits.total:
            res_offset = 0
            page_size = len(res)
            res_limit = page_size
            while res_limit <= res.hits.total:
                for doc in self._search[res_offset:res_limit]:
                    yield self._doc_class(doc)

                res_limit += page_size
                res_offset += page_size

            res_limit = res.hits.total - ((res.hits.total / page_size) * page_size)
            if res_limit > 0:
                res_offset -= page_size
                res_limit += res_offset
                for doc in self._search[res_offset:res_limit]:
                    yield self._doc_class(doc)

    def results(self, offset):
        res = self._search.execute()
        limit = offset + self._page_size
        if res.hits.total < limit:
            limit = res.hits.total

        if offset > limit:
            offset = 0
            limit = 0

        for doc in self._search[offset:limit]:
            yield self._doc_class(doc)

    def __iter__(self):
        for doc in self._search.execute():
            yield self._doc_class(doc)

    def scan(self):
        self._search.execute()
        for doc in self._search.scan():
            yield self._doc_class(doc)

    def __getitem__(self, index):
        return self._search.__getitem__(index)

    def __getattr__(self, name):
        search = self._search
        val = getattr(search, name, None)
        if val:
            return val
        else:
            raise AttributeError('\'PublicSearchManager\' has no attribute \'{}\''.format(name))


class PublicDocumentListing(object):
    def __init__(self, listing_iterator, system, path):
        self._listing_iterator = listing_iterator
        self.system = system
        self.path = path

    def to_dict(self):
        # logger.debug(self._doc.to_dict())
        obj_dict = {}
        obj_dict['system'] = self.system
        obj_dict['path'] = self.path
        obj_dict['children'] = [doc.to_file() for doc in self._listing_iterator]
        return dict(obj_dict)



class PublicElasticFileManager(BaseFileManager):
    """Manager to handle Public elastic search documents"""

    NAME = 'public'
    DEFAULT_SYSTEM_ID = 'nees.public'

    def __init__(self, ag):
        self._ag = ag
        super(PublicElasticFileManager, self).__init__()

    def listing(self, system, file_path, offset=0, limit=100, status='published'):
        file_path = file_path or '/'
        logger.debug('file_path: %s', file_path)
        if file_path == '/':
            # listing = PublicObject.listing(system, file_path,
            #                                offset=offset, limit=limit)
            publications = Publication.listing(status)
            legacy_publications = LegacyPublication.listing(offset, limit)

            # show new publications on top; don't re-display when scrolling down
            if offset == 0: 
                listing_iterator = itertools.chain(publications, legacy_publications)
            else:
                listing_iterator = legacy_publications
            listing = PublicDocumentListing(listing_iterator, system, file_path)
        else:
            fmgr = AgaveFileManager(self._ag)
            listing = fmgr.listing(system, file_path, offset, limit, status=status)
            """"
            try:
                #_list = PublicObject.listing(
                #    system, file_path, offset=offset, limit=limit
                #)
                _list = None
                #logger.debug(_list._doc.to_dict())
                #listing._wrapped['metadata'] = _list.metadata()
                #listing.trail = _list.trail()
                #logger.debug(listing._wrapped['metadata']['project'])
            except TransportError:
                pass
            """
        return listing

    def search(self, system, query_string,
               file_path=None, offset=0, limit=100, sort=None, status='published'):
        files_limit = limit
        files_offset = offset
        projects_limit = limit
        projects_offset = offset


        nees_published_query = Q('bool', must=[Q('query_string', query=query_string)])
        nees_published_search = LegacyPublicationIndexed.search()\
            .query(nees_published_query)\
            .extra(from_=offset, size=limit)
        des_published_query = Q('bool', must=[Q('query_string', query=query_string), Q({'term': {'status': status}}) ])
        des_published_search = PublicationIndexed.search()\
            .query(des_published_query)\
            .extra(from_=offset, size=limit)

        nees_published_res = nees_published_search.execute()
        des_published_res = des_published_search.execute()

        for res in des_published_res:
            new_desc = re.sub(query_string, lambda x: '<b>{}</b>'.format(x.group(0)), res.project.value.description)
            res.project.value.description = new_desc

        children = [Publication(res).to_file() for res in des_published_res]
        children += [LegacyPublication(res).to_file() for res in nees_published_res]
        
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

class PublicationManager(object):
    def save_publication(self, publication, status='publishing'):
        publication['projectId'] = publication['project']['value']['projectId']
        publication['created'] = datetime.datetime.now().isoformat()
        publication['status'] = status
        pub = Publication(publication)
        pub.save()
        return pub

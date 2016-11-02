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
from django.conf import settings
from elasticsearch import TransportError
from elasticsearch_dsl import Search, DocType
from elasticsearch_dsl.query import Q
from elasticsearch_dsl.connections import connections
from .base import BaseFileManager

logger = logging.getLogger(__name__)

try:
    es_settings = getattr(settings, 'ELASTIC_SEARCH', {})
    published_index = es_settings['published_index']
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

class PublicProjectIndexed(DocType):
    class Meta:
        index = published_index
        doc_type = 'project'

class PublicExperimentIndexed(DocType):
    class Meta:
        index = published_index
        doc_type = 'experiment'

class PublicObjectIndexed(DocType):
    class Meta:
        index = published_index
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
        except TransportError as err:
            if err.status_code == 404:
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

class PublicExpermient(object):
    """Wraps elastic search experiment
    """

    def __init__(self, doc):
        self._doc = doc

    def to_dict(self):
        obj_dict = self._doc.to_dict()
        return obj_dict

    @classmethod
    def search(cls, using=None, index=None):
        search = PublicExperimentIndexed.search(using, index)
        return PublicSearchManager(cls, search)

    def __getattr__(self, name):
        val = getattr(self._doc, name, None)
        if val:
            return val
        else:
            raise AttributeError('\'PublicExperiment\' has no attribute \'{}\''.\
                                 format(name))

class PublicObject(object):
    """Wraps elastic search object

        This class exposes extra functionality needed for
        an indexed public document instead of having any
        logic in a subclass of :class:`DocType`. This is to
        avoid any issues when using dictionaries or lists
        since :class:`DocType` automatically returns those types
        as :class:`~elasticsearch_dsl.utils.AttrDict` and
        :class:`~elasticsearch_dsl.utils.AttrList` instead of
        native types."""

    def __init__(self, doc):
        self._doc = doc
        self.system = doc.systemId
        self.path = os.path.join(doc.path, doc.name)
        self.children = []
        self._metadata = None
        self._trail = []

    @classmethod
    def listing(cls, system, path):
        list_search = PublicSearchManager(PublicObject, PublicObjectIndexed.search())
        base_path, name = os.path.split(path)
        search = PublicObjectIndexed.search()
        query = Q('bool',
                  must=[Q({'term': {'name._exact': name}}),
                        Q({'term': {'path._exact': base_path}}),
                        Q({'term': {'systemId': system}})])
        search.query = query
        res = search.execute()
        if res.hits.total:
            listing = cls(doc=res[0])
            list_path = path.strip('/')
        elif not path or path == '/':
            listing = cls(PublicObjectIndexed(systemId=PublicElasticFileManager.DEFAULT_SYSTEM_ID,
                                              path='/',
                                              name=''))
            listing.system = system
            list_path = '/'
        else:
            raise TransportError()

        
        list_search._search.query = Q('bool',
                                      must=[Q({'term': {'path._exact': list_path}}),
                                            Q({'term': {'systemId': system}})])
        list_search.sort({'project._exact': 'asc'})
        listing.children = list_search.all()

        return listing

    def project_name(self):
        if self._doc.path == '/':
            return re.sub(r'\.groups$', '', self._doc.name)
        else:
            return re.sub(r'\.groups$', '', self._doc.path.split('/')[0])

    def experiment_name(self):
        full_path = os.path.join(self._doc.path.strip('/'), self._doc.name)
        full_path_comps = full_path.split('/')
        if len(full_path_comps) >= 2:
            return full_path_comps[1]
        else:
            return ''

    def project(self):
        project_name = self.project_name()
        project_search = PublicProjectIndexed.search()
        project_search.query = Q('bool',
                                 must=[Q({'term': {'name._exact': project_name}})])
        res = project_search.execute()
        if res.hits.total:
            return res[0].to_dict()
        else:
            return {}

    def experiments(self):
        project_name = self.project_name()
        experiment_name = self.experiment_name()
        experiment_search = PublicSearchManager(PublicExpermient, PublicExperimentIndexed.search())
        must_list = [Q({'term': {'project._exact': project_name}})]
        if experiment_name:
            must_list.append(Q({'term': {'name._exact': experiment_name}}))

        experiment_search._search.query = Q('bool', must=must_list)
        experiment_search = experiment_search.sort('name._exact', 'path._exact')
        return [experiment.to_dict() for experiment in experiment_search.all()]

    def metadata(self):
        if self._metadata is None:
            self._metadata = {'project': self.project(), 
                              'experiments': self.experiments()}
        return self._metadata


    def trail(self):
        if self._trail:
            return self._trail

        path_comps = os.path.join(self._doc.path, self._doc.name).split('/')
        self._trail.append({'name': '/', 'system': self.system, 'path': '/'})
        for i in range(0, len(path_comps)):
            trail_item = {'name': path_comps[i] or '/',
                          'system': self.system,
                          'path': '/'.join(path_comps[:i+1]) or '/'}
            if i == 0:
                trail_item['name'] = self.project().get('title', path_comps[i])
            elif i == 1:
                experiment = filter(lambda x: x['name'] == path_comps[i], self.experiments())
                if experiment:
                    trail_item['name'] = experiment[0].get('title', path_comps[i])

            self._trail.append(trail_item)
        
        return self._trail

        return [{'name': path_comps[i] or '/',
                 'system': self.system,
                 'path': '/'.join(path_comps[:i+1]) or '/'
                 } for i in range(0, len(path_comps))]

    def to_dict(self):
        obj_dict = self._doc.to_dict()
        obj_dict['system'] = self.system
        obj_dict['path'] = self.path
        obj_dict['children'] = [doc.to_dict() for doc in self.children]
        obj_dict['metadata'] = self.metadata()
        obj_dict['permissions'] = 'READ'
        obj_dict['trail'] = self.trail()
        return obj_dict

    @classmethod
    def search(cls, using=None, index=None):
        search = PublicObjectIndexed.search(using, index)
        return PublicSearchManager(cls, search)

    def __getattr__(self, name):
        val = getattr(self._doc, name, None)
        if val:
            return val
        else:
            raise AttributeError('\'PublicObject\' has no attribute \'{}\''.\
                                 format(name))

class PublicElasticFileManager(BaseFileManager):
    """Manager to handle Public elastic search documents"""

    NAME = 'public'
    DEFAULT_SYSTEM_ID = 'nees.public'

    def __init__(self):
        super(PublicElasticFileManager, self).__init__()

    def listing(self, system, file_path):
        file_path = file_path or '/'
        listing = PublicObject.listing(system, file_path)
        return listing

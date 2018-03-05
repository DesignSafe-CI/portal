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

logger = logging.getLogger(__name__)

class PublicationIndexed(DocType):
    class Meta:
        index = 'published'
        doc_type = 'publication'

class Publication(object):
    def __init__(self, wrap=None, project_id=None, *args, **kwargs):
        if wrap is not None:
            if isinstance(wrap, PublicationIndexed):
                self._wrap = wrap
            else:
                s = PublicationIndexed.search()
                s.query = Q({"term":
                              {"projectId._exact": wrap['projectId']}
                            })
                try:
                    res = s.execute()
                except (TransportError, ConnectionTimeout) as e:
                    if getattr(e, 'status_code', 500) == 404:
                        raise
                    res = s.execute()

                if res.hits.total:
                    self._wrap = res[0]
                else:
                    self._wrap = PublicationIndexed(**wrap)

        elif project_id is not None:
            s = PublicationIndexed.search()
            s.query = Q({"term": {"projectId._exact": project_id }})
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
                         'projectId': self.project['value']['projectId']
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
        related_objs = dict_obj.get('modelConfigs', []) + \
                       dict_obj.get('analysisList', []) + \
                       dict_obj.get('sensorsList', []) + \
                       dict_obj.get('eventsList', []) + \
                       dict_obj.get('reportsList', [])
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

class CMSIndexed(DocType):
    class Meta:
        index = 'cms'

class PublicFullIndexed(DocType):
    class Meta:
        index = 'nees'
        doc_type = '_all'

class PublicProjectIndexed(DocType):
    class Meta:
        index = 'des-publications'
        doc_type = 'publication'

class PublicExperimentIndexed(DocType):
    class Meta:
        index = 'nees'
        doc_type = 'experiment'

class PublicObjectIndexed(DocType):
    class Meta:
        index = 'des-publications_legacy'
        doc_type = 'publication'


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
    def listing(cls, system, path, offset, limit):
        list_search = PublicSearchManager(PublicObject,
                                          PublicObjectIndexed.search(),
                                          page_size=limit)
        base_path, name = os.path.split(path.strip('/'))
        base_path = base_path or '/'
        search = PublicObjectIndexed.search()
        query = Q('bool',
                  must=[Q({'term': {'name': name}}),
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
        listing.children = list_search.results(offset)

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

    # TODO: This should not make more calls, kills performance
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


    # TODO: This should not make more calls, kills performance
    def trail(self):

        if self._trail:
            return self._trail

        path_comps = os.path.join(self._doc.path, self._doc.name).strip('/').split('/')
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

    def to_dict(self):
        # logger.debug(self._doc.to_dict())
        obj_dict = self._doc.to_dict()
        obj_dict['system'] = self.system
        obj_dict['path'] = self.path
        obj_dict['children'] = [doc.to_dict() if not hasattr(doc, 'projectId') else doc.to_file() for doc in self.children]
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

    def listing(self, system, file_path, offset=0, limit=100, status='published'):
        file_path = file_path or '/'
        listing = PublicObject.listing(system, file_path,
                                       offset=offset, limit=limit)
        publications = Publication.listing(status)
        if file_path == '/':
            listing.children = itertools.chain(publications, listing.children)

        return listing

    def search(self, system, query_string,
               file_path=None, offset=0, limit=100, sort=None):
        files_limit = limit
        files_offset = offset
        projects_limit = limit
        projects_offset = offset
        projects_search = PublicProjectIndexed.search()

        projects_query = Q('bool',
                           filter=Q('bool',
                                    must=Q({'term': {'systemId': system}}),
                                    must_not=Q({'term': {'path._exact': '/'}})),
                           must=Q({'simple_query_string':{
                                    'query': query_string,
                                    'fields': ["description",
                                               "endDate",
                                               "equipment.component",
                                               "equipment.equipmentClass",
                                               "equipment.facility",
                                               "fundorg"
                                               "fundorgprojid",
                                               "name",
                                               "organization.name",
                                               "pis.firstName",
                                               "pis.lastName",
                                               "title"]}}))
        projects_search.query = projects_query
        if sort:
            projects_search = projects_search.sort(sort)
        else:
            projects_search = projects_search.sort('name._exact')

        t1 = datetime.datetime.now()
        projects_res = projects_search.execute()
        logger.debug(datetime.datetime.now() - t1)
        files_search = PublicObjectIndexed.search()

        files_query = Q('bool',
                        must=Q({'simple_query_string': {
                                 'query': query_string,
                                 'fields': ['name']}}),
                        filter=Q('bool',
                                 must=Q({'term': {'systemId': system}}),
                                 must_not=Q({'term': {'path._exact': '/'}})))
        files_search.query = files_query

        t1 = datetime.datetime.now()
        files_res = files_search.execute()
        logger.debug(datetime.datetime.now() - t1)
        if projects_res.hits.total:
            if projects_res.hits.total - offset > limit:
                files_offset = 0
                files_limit = 0
            elif projects_res.hits.total - offset < 0:
                projects_offset = 0
                projects_limit = 0
            else:
                projects_limit = projects_res.hits.total
                files_limit = limit - projects_limit

        # TODO: This is rather SLOW
        children = []
        project_paths = [p.projectPath for p in projects_res]
        for project in projects_search[projects_offset:projects_limit]:
            logger.debug(project)
            search = PublicObjectIndexed.search()
            search.query = Q('bool',
                             must=[
                                Q({'term': {'path._exact': '/'}}),
                                Q({'term': {'name._exact': project.projectPath}}),
                                Q({'term': {'systemId': system}})])
            res = search.execute()
            print res
            if res.hits.total:
                children.append(PublicObject(res[0]).to_dict())
        # search = PublicObjectIndexed.search()
        # search.query = Q('bool',
        #     must=[
        #         Q({'term': {'path._exact': '/'}}),
        #         Q({'terms': {'name._exact': project_paths}}),
        #         Q({'term': {'systemId': system}})
        #     ])
        # res = search.execute()
        # logger.debug(datetime.datetime.now() - t1)

        # for r in res[projects_offset:projects_limit]:
        #     children.append(PublicObject(r).to_dict())

        for file_doc in files_search[files_offset:files_limit]:
            logger.debug(file_doc)
            children.append(PublicObject(file_doc).to_dict())
        logger.debug(datetime.datetime.now() - t1)
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

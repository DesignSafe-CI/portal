from django.conf import settings
from elasticsearch_dsl import Search, DocType
from elasticsearch_dsl.query import Q
from elasticsearch_dsl.connections import connections
from elasticsearch_dsl.utils import AttrList
import logging
import six
import re

logger = logging.getLogger(__name__)

es_settings = getattr(settings, 'ELASTIC_SEARCH', {})

try:
    cluster = es_settings['cluster']
    hosts = cluster['hosts']
except KeyError:
    logger.exception('ELASTIC_SEARCH missing required configuration')

connections.configure(
    default={
        'hosts': hosts,
        'sniff_on_start': True,
        'sniff_on_connection_fail': True,
        'sniffer_timeout': 60,
        'retry_on_timeout': True,
        'timeout:': 20,
    })


def _user_filter(user):
    return Q('bool', should=[Q('term', owner=user), Q('term', permissions__user=user)])


def basic_search(index, user, search_phrase):
    """

    Args:
        index: the search index to query against
        user: the user to filter results to
        search_phrase: search string. should be lowercase.

    Returns:
        A tuple of (response, search)

    """
    q = Q('query_string', query='*%s*' % search_phrase)
    s = Search(index=index).query('filtered', query=q, filter=_user_filter(user))
    response = s.execute()
    return response, s


def advanced_search(index, user, search_terms):
    """

    Args:
        index: the search index to query against
        user: the user to filter results to
        search_terms: a dictionary of {"field":"value"} to query. values should be
                      lowercase.

    Returns:
        A tuple of (response, search)

    """

    should = []
    for term, query in six.iteritems(search_terms):
        should.append(Q('query_string', query='*%s*' % query, default_field=term))
    q = Q('bool', should=should)
    s = Search(index=index).query('filtered', query=q, filter=_user_filter(user))
    response = s.execute()
    return response, s

class Project(DocType):
    def search_by_name(self, name, fields = None):
        name = re.sub(r'\.groups$', '', name)
        q = {"query":{"bool":{"must":[{"term":{"name._exact":name}}]}} }
        if fields is not None:
            q['fields'] = fields
        s = self.__class__.search()
        s.update_from_dict(q)
        return s.execute(), s

    def search_query(self, system_id, username, qs):
        fields = ["description",
                  "endDate",
                  "equipment.component",
                  "equipment.equipmentClasse",
                  "equipment.facility",
                  "fundorg"
                  "fundorgprojid",
                  "name",
                  "organization.name",
                  "pis.firstName",
                  "pis.lastName",
                  "title"]
        qs = '*{}*'.format(qs)
        q = {"query": { "query_string": { "fields":fields, "query": qs}}}
        s = self.__class__.search()
        s.update_from_dict(q)
        return s.execute(), s

    def update_from_dict(self, **d):
        if '_id' in d:
            d.pop('_id')
        self.update(**d)
        return self

    def save(self, **kwargs):
        o = self.__class__.get(id = self._id, ignore = 404)
        if o is not None:
            return self.update(**self.to_dict())
        else:
            return super(Project, self).save(**kwargs)

    class Meta:
        index = 'nees'
        doc_type = 'project'

class Experiment(DocType):
    def search_by_project(self, project):
        project = re.sub(r'\.groups$', '', project)
        q = {"query":{"bool":{"must":[{"term":{"project._exact":project}}]}} }
        s = self.__class__.search()
        s.update_from_dict(q)
        return s.execute(), s

    def search_by_name(self, name):
        q = {"query":{"bool":{"must":[{"term":{"name._exact":name}}]}} }
        s = self.__class__.search()
        s.update_from_dict(q)
        return s.execute(), s

    def search_query(self, system_id, username, qs):
        fields = ["description",
                  "facility.country"
                  "facility.name",
                  "facility.state",
                  "name",
                  "project",
                  "startDate",
                  "title"]
        qs = '*{}*'.format(qs)
        q = {"query": { "query_string": { "fields":fields, "query": qs}}}
        s = self.__class__.search()
        s.update_from_dict(q)
        return s.execute(), s

    def update_from_dict(self, **d):
        if '_id' in d:
            d.pop('_id')
        self.update(**d)
        return self

    def save(self, **kwargs):
        o = self.__class__.get(id = self._id, ignore = 404)
        if o is not None:
            return self.update(**self.to_dict())
        else:
            return super(Experiment, self).save(**kwargs)

    class Meta:
        index = 'nees'
        doc_type = 'experiment'

class PublicObject(DocType):
    def search_partial_path(self, system_id, username, path):
        q = {"query":{"bool":{"must":[{"term":{"path._path":path}}, {"term": {"systemId": system_id}}]}} }
        s = self.__class__.search()
        s.update_from_dict(q)
        return s.execute(), s

    def search_exact_path(self, system_id, username, path, name):
        q = {"query":{"bool":{"must":[{"term":{"path._exact":path}},{"term":{"name._exact":name}}, {"term": {"systemId": system_id}}]}}}
        s = self.__class__.search()
        s.update_from_dict(q)
        return s.execute(), s

    def search_exact_folder_path(self, system_id, path):
        q = {"query":{"bool":{"must":[{"term":{"path._exact":path}}, {"term": {"systemId": system_id}}]}}}
        s = self.__class__.search()
        s.update_from_dict(q)
        return s.execute(), s

    def search_query(self, system_id, username, qs):
        fields = ["name", "path", "project", "pis.lastName", "pis.firstName"]
        qs = '*{}*'.format(qs)
        q = {"query": { "query_string": { "fields":fields, "query": qs}}}
        s = self.__class__.search()
        s.update_from_dict(q)
        return s.execute(), s

    def update_from_dict(self, **d):
        if '_id' in d:
            d.pop('_id')
        self.update(**d)
        return self

    def save(self, **kwargs):
        o = self.__class__.get(id = self._id, ignore = 404)
        if o is not None:
            return self.update(**self.to_dict())
        else:
            return super(PublicObject, self).save(**kwargs)

    def to_dict(self, *args, **kwargs):
        d = super(PublicObject, self).to_dict(*args, **kwargs)
        r, s = Project().search_by_name(self.project, ['title'])
        if r.hits.total:
            title = r[0].title
            if isinstance(title, AttrList):
                d['projecTitle'] = title[0]
            else:
                d['projecTitle'] = title
        return d

    class Meta:
        index = 'nees'
        doc_type = 'object'

class Object(DocType):
    #def search_partial_path(self, system_id, path):
    #    s = self.search().query('filtered', query =
    #    s.filter('term', systemId=system_id)
    def search_partial_path(self, system_id, username, path):
        '''
            {
                "query": {
                    "filtered": {
                        "filter": {
                            "bool": {
                                "should": [
                                    {
                                        "term": {
                                            "owner": "xirdneh"
                                        }
                                    },
                                    {
                                        "term": {
                                            "permissions.username": "xirdneh"
                                        }
                                    }
                                ]
                            }
                        },
                        "query": {
                            "bool": {
                                "must": [
                                    {
                                        "term": {
                                            "value.path._exact": "xirdneh"
                                        }
                                    },
                                    {
                                        "term": {
                                            "value.name._exact": "apps"
                                        }
                                    },
                                    {
                                        "term": {
                                            "value.systemId": "designsafe.storage.default"
                                        }
                                    }
                                ]
                            }
                        }
                    }
                }
            }
        '''
        q = {"query":{"filtered":{"query":{"bool":{"must":[{"term":{"path._path":path}}, {"term": {"systemId": system_id}}]}},"filter":{"bool":{"should":[{"term":{"owner":username}},{"term":{"permissions.username":username}}], "must_not":{"term":{"deleted":"true"}}}}}}}
        s = self.__class__.search()
        s.update_from_dict(q)
        return s.execute(), s

    def search_exact_path(self, system_id, username, path, name):
        q = {"query":{"filtered":{"query":{"bool":{"must":[{"term":{"path._exact":path}},{"term":{"name._exact":name}}, {"term": {"systemId": system_id}}]}},"filter":{"bool":{"should":[{"term":{"owner":username}},{"term":{"permissions.username":username}}], "must_not":{"term":{"deleted":"true"}}}}}}}
        s = self.__class__.search()
        s.update_from_dict(q)
        return s.execute(), s

    def search_exact_folder_path(self, system_id, username, path):
        q = {"query":{"filtered":{"query":{"bool":{"must":[{"term":{"path._exact":path}}, {"term": {"systemId": system_id}}]}},"filter":{"bool":{"should":[{"term":{"owner":username}},{"term":{"permissions.username":username}}], "must_not":{"term":{"deleted":"true"}} }}}}}
        s = self.__class__.search()
        s.update_from_dict(q)
        return s.execute(), s

    def search_query(self, system_id, username, qs):
        fields = ["name", "path", "keywords"]
        qs = '*{}*'.format(qs)
        q = { "query": { "filtered": { "query": { "query_string": { "fields":fields, "query": qs}}, "filter":{"bool":{"should":[ {"term":{"owner":username}},{"term":{"permissions.username":username}}], "must_not":{"term":{"deleted":"true"}}}}}}}
        s = self.__class__.search()
        s.update_from_dict(q)
        return s.execute(), s

    def search_special_dir(self, system_id, username, path, self_root):
        '''
        {
        "query": {
                    "filtered": {
                        "filter": {
                            "bool": {
                                "should": [
                                    {
                                        "term": {
                                            "owner": "xirdneh"
                                        }
                                    },
                                    {
                                        "term": {
                                            "permissions.username": "xirdneh"
                                        }
                                    }
                                ]
                            }
                        },
                        "query": {
                            "bool": {
                                "must": [
                                    {
                                        "term": {
                                            "value.path._exact": "/"
                                        }
                                    },
                                    {
                                        "term": {
                                            "value.systemId": "designsafe.storage.default"
                                        }
                                    }
                                ],
                                "must_not": {
                                    "term": {
                                        "value.name._exact": "xirdneh"
                                    }
                                }
                            }
                        }
                    }
                }
            }
        '''

        if not self_root:
            q = {"query":{"filtered":{"query":{"bool":{"must":[{"term":{"path._exact":path}},{"term": {"systemId": system_id}}], "must_not":{"term": {"name._exact":username}}  }},"filter":{"bool":{"should":[{"term":{"owner":username}},{"term":{"permissions.username":username}}], "must_not":{"term":{"deleted":"true"}}}}}}}
        else:
            q = {"query":{"filtered":{"query":{"bool":{"must":[{"term":{"path._exact":path}},{"term": {"systemId": system_id}}] }},"filter":{"bool":{"should":[{"term":{"owner":username}},{"term":{"permissions.username":username}}], "must_not":{"term":{"deleted":"true"}}}}}}}
        s = self.__class__.search()
        s.update_from_dict(q)
        return s.execute(), s

    def update_from_dict(self, **d):
        if '_id' in d:
            d.pop('_id')
        self.update(**d)
        return self

    def save(self, **kwargs):
        o = self.__class__.get(id = self._id, ignore = 404)
        if o is not None:
            return self.update(**self.to_dict())
        else:
            return super(Object, self).save(**kwargs)

    class Meta:
        index = 'designsafe'
        doc_type = 'objects'

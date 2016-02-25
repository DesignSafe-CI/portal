from django.conf import settings
from elasticsearch_dsl import Search, DocType
from elasticsearch_dsl.query import Q
from elasticsearch_dsl.connections import connections
import logging
import six

logger = logging.getLogger(__name__)

es_settings = getattr(settings, 'ELASTIC_SEARCH', {})

try:
    cluster = es_settings['cluster']
    hosts = cluster['hosts']
except KeyError:
    logger.exception('ELASTIC_SEARCH missing required configuration')

connections.create_connection(hosts=hosts, timeout=20)


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
        q = {"query":{"filtered":{"query":{"bool":{"must":[{"term":{"value.path._path":path}}, {"term": {"value.systemId": system_id}}]}},"filter":{"bool":{"should":[{"term":{"owner":username}},{"term":{"permissions.username":username}}]}}}}}
        s = Search.from_dict(q)
        s.doc_type(self)
        return s.execute(), s

    def search_exact_path(self, system_id, username, path, name):
        q = {"query":{"filtered":{"query":{"bool":{"must":[{"term":{"value.path._exact":path}},{"term":{"value.name._exact":name}}, {"term": {"value.systemId": system_id}}]}},"filter":{"bool":{"should":[{"term":{"owner":username}},{"term":{"permissions.username":username}}]}}}}}
        s = Search.from_dict(q)
        s.doc_type(self)
        return s.execute(), s

    def search_special_dir(self, system_id, username, path):
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
        q = {"query":{"filtered":{"query":{"bool":{"must":[{"term":{"value.path._exact":path}},{"term": {"value.systemId": system_id}}], "must_not":{"term": {"value.name._exact":username}}}},"filter":{"bool":{"should":[{"term":{"owner":username}},{"term":{"permissions.username":username}}]}}}}}
        s = Search.from_dict(q)
        s.doc_type(self)
        return s.execute(), s     
   
    class Meta:
        index = 'designsafe'
        doc_type = 'objects'


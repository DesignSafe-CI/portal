from django.conf import settings
from elasticsearch_dsl import Search
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
    return Q('bool', should=[Q('term', owner=user), Q('term', permission=user)])


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

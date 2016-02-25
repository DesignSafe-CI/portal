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
    return Q('bool', should=[Q('term', owner=user), Q('term', permissions=user)])


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
    @classmethod
    def from_agave_file_meta_obj(cls, meta_obj):
        d = {
            '_id': meta_obj.uuid,
            'uuid': meta_obj.uuid,
            'association_ids': meta_obj.association_ids,
            'lastUpdated': meta_obj.last_modified,
            'created': meta_obj.created,
            'name': meta_obj.meta_name,
            'owner': meta_obj.owner,
            'internalUsername': meta_obj.internal_username,
            'schemaId': meta_obj.schema_id,
            'value': {
                'deleted': meta_obj.deleted,
                'type': meta_obj.type,
                'fileType': meta_obj.file_type,
                'length': meta_obj.length,
                'mimeType': meta_obj.mime_type,
                'name': meta_obj.name,
                'path': meta_obj.path,
                'systemId': meta_obj.system_id,
                'keywords': meta_obj.keywords,
                'systemTags': meta_obj.system_tags,
            },
            '_links': meta_obj._links,
            'permissions': meta_obj.permissions
        }
        return cls(**d)

    class Meta:
        index = 'designsafe'
        doc_type = 'objects'


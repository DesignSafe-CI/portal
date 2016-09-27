import logging
from .base import BaseFileManager
from django.conf import settings
from elasticsearch import TransportError
from elasticsearch_dsl.query import Q
from elasticsearch_dsl import Search, DocType
from elasticsearch_dsl.connections import connections


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


class IndexedFile(DocType):

    class Meta:
        index = default_index
        doc_type = 'objects'


class ElasticFileManager(BaseFileManager):

    def __init__(self):
        super(ElasticFileManager, self).__init__()

    @staticmethod
    def listing(system, file_path, user_context):
        q = Q('bool', must = Q({'term': {'path._exact': file_path}}))
        filter_parts = [
            Q({'term': {'systemId': system}}),
            Q({'term': {'deleted': False}})
        ]
        if user_context is not None:
            filter_parts.append(Q({'term': {'permissions.username': user_context}}))
        f = Q('bool', must=filter_parts)

        query = Q('filtered', query=q, filter=f)

        search = IndexedFile.search()
        search.query = query
        search = search.sort({'name._exact': 'asc'})

        try:
            res = search.execute()
        except TransportError as e:
            if e.status_code == 404:
                raise
            res = search.execute()

        result = {
            'trail': [{'name': '$SHARE', 'path': '/$SHARE'}],
            'name': '$SHARE',
            'path': '/$SHARE',
            'system': system,
            'type': 'dir',
            'children': []
        }
        for f in search[0:res.hits.total]:
            result['children'].append(f.to_dict())
        return result

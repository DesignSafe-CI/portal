import six
import json
import logging
from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
import elasticsearch
from elasticsearch import TransportError

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    """This command uses elasticsearch's reindex api
    https://www.elastic.co/guide/en/elasticsearch/reference/current/docs-reindex.html
    """
    help = 'Reindex documents from one index to another'

    def add_arguments(self, parser):
        parser.add_argument('from_index', help="Index from which reindex data")
        parser.add_argument('to_index', help="Index to which reindex data")
        parser.add_argument('--doc-type', help="Document type to reindex")
        parser.add_argument('--all-docs', help="Reindex all documents", action="store_true",
                            default=True)
        parser.add_argument('--remote-host', help="Remote host where 'from_index' resides." \
                            "Use this if we need to copy data from a remote cluster." \
                            "You can use http(s)?://<url>:<port> or a 'ES_CONNECTIONS' "\
                            "key (e.g. 'default' or 'staging')")
        parser.add_argument('--timeout', help="Reindexing request timeout", type=int)

    def handle(self, *args, **options):
        from_index = options.get('from_index')
        to_index = options.get('to_index')
        doc_type = options.get('doc-type')
        all_docs = options.get('all-docs')
        remote_host = options.get('remote_host')

        body = {
            "source": {
                "index": from_index
            },
            "dest": {
                "index": to_index
            }
        }

        if remote_host:
            if remote_host.startswith('http://') \
                or remote_host.startswith('https://'):
                hosts = [remote_host]
            else:
                hosts = settings.ES_CONNECTIONS.get(remote_host, {}).get('hosts', [])
            body['source']['remote'] = {'host': 'http://{}:9200'.format(hosts[0])}
        else:
            hosts = settings.ES_CONNECTIONS[settings.DESIGNSAFE_ENVIRONMENT]['hosts']

        if not hosts:
            raise CommandError('No valid remote hosts given. Remote host value given: {}'.\
                format(remote_host))

        if not all_docs and doc_type:
            body['source']['type'] = doc_type

        es_local = elasticsearch.Elasticsearch(
            settings.ES_CONNECTIONS[settings.DESIGNSAFE_ENVIRONMENT]['hosts'],
            request_timeout=120)
        es_remote = elasticsearch.Elasticsearch(hosts, request_timeout=120)
        self.stdout.write('local conn: %s' % settings.ES_CONNECTIONS[settings.DESIGNSAFE_ENVIRONMENT]['hosts'])
        self.stdout.write('remote conn: %s' % hosts)
        remote_index = es_remote.indices.get(from_index)
        try:
            local_index = es_local.indices.get(to_index)
        except TransportError as err:
            if err.status_code == 404:
                self.stdout.write('Creating index: %s' % to_index)
                index_mapping = remote_index[from_index]['mappings']
                self.stdout.write('Using mapping: %s' % json.dumps(index_mapping))
                index_settings = remote_index[from_index]['settings']
                self.stdout.write('Using Settings: %s' % json.dumps(index_settings))
                index_settings['index'].pop('uuid', None)
                index_settings['index'].pop('creation_date')
                index_settings['index'].pop('version')
                try:
                    for key, value in six.iteritems(index_mapping):
                        properties = value['properties']
                        for prop_name, prop_val in six.iteritems(properties):
                            if 'fields' in prop_val:
                                for field_name, field_val in six.iteritems(prop_val['fields']):
                                    print field_val
                                    field_val.pop('fielddata', None)
                except:
                    pass
                local_index = es_local.indices.create(
                    to_index,
                    body={
                        "settings": index_settings,
                        "mappings": index_mapping
                    })
            else:
                raise
        self.stdout.write('body to use: %s' % body)
        resp = es_local.reindex(body=body, request_timeout=options.get('timeout', 120))
        self.stdout.write(json.dumps(resp))

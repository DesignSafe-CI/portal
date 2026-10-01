"""Reindex command"""
import json
import logging

import elasticsearch
import six
from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
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
        parser.add_argument('--sample', help="set to True to take a random sample", default=False, type=bool)
        parser.add_argument('--size', help="size of the sample (default=100000)", default=100000, type=int)
        parser.add_argument('--seed', help="seed for randomization", default="tacc rulz ok", type=str)

    def remove_fielddata(self, dict_obj, lvl=1):
        for key, val in six.iteritems(dict_obj):
            #self.stdout.write('-' * lvl + key)
            if 'fielddata' in val:
                val.pop('fielddata')
            if 'fields' in val:
                for fields_key, fields_val in six.iteritems(val['fields']):
                    #self.stdout.write('-' * (lvl + 1) + fields_key)
                    if 'fielddata' in fields_val:
                        fields_val.pop('fielddata')
            if 'properties' in val:
                lvl += 1
                self.remove_fielddata(val['properties'], lvl)

    def handle(self, *args, **options):
        from_index = options.get('from_index')
        to_index = options.get('to_index')
        doc_type = options.get('doc_type')
        options.get('all_docs')
        remote_host = options.get('remote_host')
        sample = options.get('sample')
        size = options.get('size')
        seed = options.get('seed')

        body = {
            "source": {
                "index": from_index
            },
            "dest": {
                "index": to_index
            }
        }

        if sample:
            body["size"] = size

            body["source"]["query"] = {
                "function_score": {
                    "query": {
                        "match_all": {}
                    },
                    "functions": [{
                        "random_score": {"seed": seed}
                    }]
                }
            }


        if remote_host:
            if remote_host.startswith(('http://', 'https://')):
                hosts = [remote_host]
                body['source']['remote'] = {'host': f'{hosts[0]}:9200'}
            else:
                hosts = settings.ES_CONNECTIONS.get(remote_host, {}).get('hosts', [])
                body['source']['remote'] = {'host': f'http://{hosts[0]}:9200'}
        else:
            hosts = settings.ES_CONNECTIONS[settings.DESIGNSAFE_ENVIRONMENT]['hosts']

        if not hosts:
            raise CommandError(f'No valid remote hosts given. Remote host value given: {remote_host}')

        if doc_type:
            body['source']['type'] = doc_type
            self.stdout.write(f'doc_type: {doc_type}')
        es_local = elasticsearch.Elasticsearch(
            settings.ES_CONNECTIONS[settings.DESIGNSAFE_ENVIRONMENT]['hosts'],
            request_timeout=120)
        es_remote = elasticsearch.Elasticsearch(hosts, request_timeout=120)
        self.stdout.write('local conn: {}'.format(settings.ES_CONNECTIONS[settings.DESIGNSAFE_ENVIRONMENT]['hosts']))
        self.stdout.write(f'remote conn: {hosts}')
        remote_index = es_remote.indices.get(from_index)
        try:
            es_local.indices.get(to_index)
        except TransportError as err:
            if err.status_code == 404:
                self.stdout.write(f'Creating index: {to_index}')
                index_mapping = remote_index[from_index]['mappings']
                index_settings = remote_index[from_index]['settings']
                self.stdout.write(f'Using Settings: {json.dumps(index_settings)}')
                index_settings['index'].pop('uuid', None)
                index_settings['index'].pop('creation_date')
                index_settings['index'].pop('version')
                index_settings['index'].pop('provided_name', None)
                self.remove_fielddata(index_mapping)
                self.stdout.write(f'Using mapping: {json.dumps(index_mapping)}')
                es_local.indices.create(
                    to_index,
                    body={
                        "settings": index_settings,
                        "mappings": index_mapping
                    })
            else:
                raise
        self.stdout.write(f'body to use: {body}')
        resp = es_local.reindex(body=body, request_timeout=options.get('timeout', 120))
        self.stdout.write(json.dumps(resp))

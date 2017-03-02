from elasticsearch_dsl.connections import connections
from django.conf import settings

es_settings = getattr(settings, 'ELASTIC_SEARCH')
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
    }
)

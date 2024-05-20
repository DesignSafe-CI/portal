"""Elastic search connection configuration"""
import os 

ES_INDEX_PREFIX = os.environ.get('ES_INDEX_PREFIX', 'designsafe-dev-{}')
ES_AUTH = os.environ.get('ES_AUTH', 'username:password')

ES_CONNECTIONS = {
    'default': {
        'hosts': [
            'https://wma-es-client.tacc.utexas.edu:9200',
        ],
    },
    'staging': { #dev/qa
        'hosts':  [
            'https://wma-es-client.tacc.utexas.edu:9200',
        ]
    },
    'dev': {
        'hosts': [
            'elasticsearch:9200'
        ]
    },
    'localhost': {
        'hosts': [
            'localhost'
        ]
    }
}

ES_INDICES = {
    'files': {
        'alias': ES_INDEX_PREFIX.format('files'),
        'document': 'designsafe.apps.data.models.elasticsearch.IndexedFile',
        'kwargs': {'number_of_shards': 3}
    },
    'files_legacy': {
        'alias': ES_INDEX_PREFIX.format('files-legacy'),
        'document': 'designsafe.apps.data.models.elasticsearch.IndexedFileLegacy',
        'kwargs': {'number_of_shards': 3}
    },
    'publications': {
        'alias': ES_INDEX_PREFIX.format('publications'),
        'document': 'designsafe.apps.data.models.elasticsearch.IndexedPublication',
        'kwargs': {'index.mapping.total_fields.limit': 3000}
    },
    'publications_v2': {
        'alias': ES_INDEX_PREFIX.format('publications_v2'),
        'document': 'designsafe.apps.api.publications_v2.elasticsearch.IndexedPublication',
        'kwargs': {}
    },
    'web_content': {
        'alias': ES_INDEX_PREFIX.format('web-content'),
        'document': 'designsafe.apps.data.models.elasticsearch.IndexedCMSPage',
        'kwargs': {}
    },
    'publications_legacy': {
        'alias': ES_INDEX_PREFIX.format('publications-legacy'),
        'document': 'designsafe.apps.data.models.elasticsearch.IndexedPublicationLegacy',
        'kwargs': {}
    },
    'rapid_event': {
        'alias': ES_INDEX_PREFIX.format('rapid-events'),
        'document': 'designsafe.apps.rapid.models.RapidNHEvent',
        'kwargs': {}
    },
    'rapid_event_type': {
        'alias': ES_INDEX_PREFIX.format('rapid-event-types'),
        'document': 'designsafe.apps.rapid.models.RapidNHEventType',
        'kwargs': {}
    },
    'projects': {
        'alias': ES_INDEX_PREFIX.format('projects'),
        'document': 'designsafe.apps.projects.models.elasticsearch.IndexedProject',
        'kwargs': {}
    },
    'project_entities': {
        'alias': ES_INDEX_PREFIX.format('project-entities'),
        'document': 'designsafe.apps.projects.models.elasticsearch.IndexedEntity',
        'kwargs': {}

    },
    'allocations': {
        'alias': ES_INDEX_PREFIX.format('allocations'),
        'document': 'designsafe.apps.projects.models.elasticsearch.IndexedAllocation',
        'kwargs': {}
    },
    #'apps': {
    #    'name': 'des-apps_a',
    #    'alias': ['des-apps'],
    #    'documents': [{'name': 'app',
    #                   'class': 'designsafe.apps.workspace.models.elasticsearch.IndexedApp'}]
    #},
    #'jobs': {
    #    'name': 'des-jobs_a',
    #    'alias': ['des-jobs'],
    #    'documents': [{'name': 'job',
    #                   'class': 'designsafe.apps.workspace.models.elasticsearch.IndexedJob'}]
    #}
}

HAYSTACK_CONNECTIONS = {
    'default': {
        'ENGINE': 'haystack.backends.elasticsearch_backend.ElasticsearchSearchEngine',
        # 'URL': 'des_elasticsearch:9200/',
        'URL': ES_CONNECTIONS[os.environ.get('DESIGNSAFE_ENVIRONMENT', 'dev')]['hosts'][0],
        'INDEX_NAME': ES_INDEX_PREFIX.format('cms'),
        'KWARGS': {'http_auth': ES_AUTH}
    }
}

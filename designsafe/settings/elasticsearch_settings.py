import os

"""Elastic search connection configuration"""
ES_CONNECTIONS = {
    'default': {
        'hosts': [
            'designsafe-es01.tacc.utexas.edu',
            'designsafe-es02.tacc.utexas.edu',
        ],
    },
    'stagig': { #dev/qa
        'hosts':  [
            'designsafe-es01-dev.tacc.utexas.edu',
        ]
    },
    'dev': {
        'hosts': [
            'es_designsafe'
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
        'name': 'designsafe_a',
        'alias': ['designsafe'],
        'documents': [{'name': 'objects',
                       'class': 'designsafe.apps.data.models.IndexedFile'}]
    },
    'rapid': {
        'name': 'rapid_nh_a',
        'alias': ['rapid_nh'],
        'documents': [{'name': 'event',
                       'class': 'designsafe.apps.rapid.models.RapidNHEvent'},
                      {'name': 'eventType',
                       'class': 'designsafe.apps.rapid.models.RapidNHEventType'}]
    },
    'publications': {
        'name': 'publications_a',
        'alias': ['publications'],
        'documents': [{'name': 'publication',
                       'class': 'designsafe.apps.data.models.IndexedPublication'}]
    },
    'web_content': {
        'name': 'web_content_a',
        'alias': ['web_content'],
        'documents': [{'name': 'page',
                       'class': 'designsafe.apps.data.models.IndexedCMSPage'}]
    },
    'publications_legacy': {
        'name': 'publications_legacy_a',
        'alias': ['publications_legacy'],
        'documents': [{'name': 'publication',
                       'class': 'designsafe.apps.data.models.IndexPublicationLegacy'}]
    }
}

"""
if (os.environ.get('DESIGNSAFE_ENVIRONMENT', 'dev').lower() == 'prod'):
    ELASTIC_SEARCH = {
        'cluster': {
            'hosts': [
                'designsafe-es01.tacc.utexas.edu',
                'designsafe-es02.tacc.utexas.edu',
            ]
        },
        'default_index': 'designsafe',
        'published_index': 'nees'
    }

    HAYSTACK_CONNECTIONS = {
        'default': {
            'ENGINE': 'haystack.backends.elasticsearch_backend.ElasticsearchSearchEngine',
            'URL': 'designsafe-es01.tacc.utexas.edu:9200/',
            'INDEX_NAME': 'cms',
        }
    }
elif (os.environ.get('DESIGNSAFE_ENVIRONMENT', 'dev').lower() == 'staging'):
    ELASTIC_SEARCH = {
        'cluster': {
            'hosts': [
                'designsafe-es01-dev.tacc.utexas.edu',
            ]
        },
        'default_index': 'designsafe',
        'published_index': 'nees'
    }

    HAYSTACK_CONNECTIONS = {
        'default': {
            'ENGINE': 'haystack.backends.elasticsearch_backend.ElasticsearchSearchEngine',
            'URL': 'designsafe-es01-dev.tacc.utexas.edu:9200/',
            'INDEX_NAME': 'cms',
        }
    }
else:
    ELASTIC_SEARCH = {
        'cluster': {
            'hosts': [
                'des_elasticsearch',
            ]
        },
        'default_index': 'designsafe',
        'published_index': 'nees'
    }
    HAYSTACK_CONNECTIONS = {
        'default': {
            'ENGINE': 'haystack.backends.elasticsearch_backend.ElasticsearchSearchEngine',
            'URL': 'des_elasticsearch:9200/',
            'INDEX_NAME': 'cms',
        }
    }
"""

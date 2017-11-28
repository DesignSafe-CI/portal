import os

"""Elastic search connection configuration"""
HAYSTACK_CONNECTIONS = {
    'default': {
        'ENGINE': 'haystack.backends.elasticsearch_backend.ElasticsearchSearchEngine',
        'URL': 'des_elasticsearch:9200/',
        'INDEX_NAME': 'cms',
    }
}

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
            'elasticsearch'
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
        'name': 'des-files_a',
        'alias': ['des-files'],
        'documents': [{'name': 'file',
                       'class': 'designsafe.apps.data.models.IndexedFile'}]
    },
    'publications': {
        'name': 'des-publications_a',
        'alias': ['des-publications'],
        'documents': [{'name': 'publication',
                       'class': 'designsafe.apps.data.models.IndexedPublication'}]
    },
    'web_content': {
        'name': 'des-web_content_a',
        'alias': ['des-web_content'],
        'documents': [{'name': 'page',
                       'class': 'designsafe.apps.data.models.IndexedCMSPage'}]
    },
    'publications_legacy': {
        'name': 'publications_legacy_a',
        'alias': ['des-publications_legacy'],
        'documents': [{'name': 'publication',
                       'class': 'designsafe.apps.data.models.IndexedPublicationLegacy'}]
    },
    'rapid': {
        'name': 'des-rapid_nh_a',
        'alias': ['des-rapid_nh'],
        'documents': [{'name': 'event',
                       'class': 'designsafe.apps.rapid.models.RapidNHEvent'},
                      {'name': 'eventType',
                       'class': 'designsafe.apps.rapid.models.RapidNHEventType'}]
    },
    'projects': {
        'name': 'des-projects_a',
        'alias': ['des-projects'],
        'documents': [{'name': 'project',
                       'class': 'designsafe.apps.projects.models.IndexedProject'}]
    },
    'project_entities': {
        'name': 'des-project_entities_a',
        'alias': ['des-projects_entities'],
        'documents': [{'name': 'entity',
                       'class': 'designsafe.apps.projects.models.IndexedEntity'}]
    },
    'apps': {
        'name': 'des-apps_a',
        'alias': ['des-apps'],
        'documents': [{'name': 'app',
                       'class': 'designsafe.apps.workspace.models.IndexedApp'}]
    },
    'jobs': {
        'name': 'des-jobs_a',
        'alias': ['des-jobs'],
        'documents': [{'name': 'job',
                       'class': 'designsafe.apps.workspace.models.IndexedJob'}]
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
    HAYSTACK_CONNECTIONS = {
        'default': {
            'ENGINE': 'haystack.backends.elasticsearch_backend.ElasticsearchSearchEngine',
            'URL': 'des_elasticsearch:9200/',
            'INDEX_NAME': 'cms',
        }
    }
"""

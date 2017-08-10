import os

"""Elastic search connection configuration"""
if (os.environ.get('DESIGNSAFE_ENVIRONMENT', 'Prod').lower() == 'true'):
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
elif (os.environ.get('DESIGNSAFE_ENVIRONMENT', 'Staging').lower() == 'true'):
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
                'elasticsearch',
            ]
        },
        'default_index': 'designsafe',
        'published_index': 'nees'
    }
    HAYSTACK_CONNECTIONS = {
        'default': {
            'ENGINE': 'haystack.backends.elasticsearch_backend.ElasticsearchSearchEngine',
            'URL': 'elasticsearch:9200/',
            'INDEX_NAME': 'cms',
        }
    }

import os

"""Elastic search connection configuration"""
if not (os.environ.get('DJANGO_DEBUG', 'False').lower() == 'true'):
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

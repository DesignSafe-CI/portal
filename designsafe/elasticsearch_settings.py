"""Elastic search connection configuration"""
# ELASTIC_SEARCH = {
#     'cluster': {
#         'hosts': [
#             'designsafe-es01.tacc.utexas.edu',
#             'designsafe-es02.tacc.utexas.edu',
#         ]
#     },
#     'default_index': 'designsafe',
#     'published_index': 'nees'
# }
ELASTIC_SEARCH = {
    'cluster': {
        'hosts': [
            'elasticsearch',
        ]
    },
    'default_index': 'designsafe',
    'published_index': 'nees'
}

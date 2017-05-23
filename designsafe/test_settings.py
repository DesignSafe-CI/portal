from common_settings import *

SITE_ID = 1

# Just use the model backend for simulated logins
AUTHENTICATION_BACKENDS = ('django.contrib.auth.backends.ModelBackend',)

# Fake values

# Box sync
BOX_APP_CLIENT_ID = 'boxappclientid'
BOX_APP_CLIENT_SECRET = 'boxappclientsecret'
BOX_SYNC_AGAVE_SYSTEM = 'storage.example.com'

# Reconfigure Celery for testing
CELERY_EAGER_PROPAGATES_EXCEPTIONS = True
CELERY_ALWAYS_EAGER = True
BROKER_BACKEND = 'memory'

# No token refreshes during testing
MIDDLEWARE_CLASSES = [c for c in MIDDLEWARE_CLASSES if c !=
                      'designsafe.apps.auth.middleware.AgaveTokenRefreshMiddleware']

# Agave
AGAVE_TENANT_ID = 'example.com'
AGAVE_TENANT_BASEURL = 'https://api.example.com'
AGAVE_CLIENT_KEY = 'example_com_client_key'
AGAVE_CLIENT_SECRET = 'example_com_client_secret'
AGAVE_SUPER_TOKEN = 'example_com_client_token'
AGAVE_STORAGE_SYSTEM = 'storage.example.com'

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'default': {
            'format': '[DJANGO] %(levelname)s %(asctime)s %(module)s '
                      '%(name)s.%(funcName)s:%(lineno)s: %(message)s'
        },
        'agave': {
            'format': '[AGAVE] %(levelname)s %(asctime)s %(module)s '
                      '%(name)s.%(funcName)s:%(lineno)s: %(message)s'
        },
        'metrics': {
            'format': '[METRICS] %(message)s user=%(user)s op=%(operation)s info=%(info)s'
        },
    },
    'handlers': {
        'console': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
            'formatter': 'default',
        },
        'metrics': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'metrics',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': True,
        },
        'designsafe': {
            'handlers': ['console'],
            'level': 'DEBUG',
        },
        'dsapi': {
            'handlers': ['console'],
            'level': 'DEBUG',
        },
        'celery': {
            'handlers': ['console'],
            'level': 'DEBUG',
        },
        'opbeat': {
            'handlers': ['console'],
            'level': 'DEBUG',
        },
        'metrics': {
            'handlers': ['metrics'],
            'level': 'DEBUG',
        },
    },
}

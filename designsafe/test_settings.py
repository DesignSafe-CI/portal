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

# No pipeline please
PIPELINE_ENABLED = False

# Agave
AGAVE_TENANT_ID = 'example.com'
AGAVE_TENANT_BASEURL = 'https://api.example.com'
AGAVE_CLIENT_KEY = 'example_com_client_key'
AGAVE_CLIENT_SECRET = 'example_com_client_secret'
AGAVE_SUPER_TOKEN = 'example_com_client_token'
AGAVE_STORAGE_SYSTEM = 'storage.example.com'

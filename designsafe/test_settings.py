from common_settings import *

SITE_ID = 1

# Just use the model backend for simulated logins
AUTHENTICATION_BACKENDS = ('django.contrib.auth.backends.ModelBackend',)

# Fake values
BOX_APP_CLIENT_ID = 'boxappclientid'
BOX_APP_CLIENT_SECRET = 'boxappclientsecret'

# Reconfigure Celery for testing
CELERY_EAGER_PROPAGATES_EXCEPTIONS = True
CELERY_ALWAYS_EAGER = True
BROKER_BACKEND = 'memory'

# No token refreshes during testing
MIDDLEWARE_CLASSES = [c for c in MIDDLEWARE_CLASSES if c !=
                      'designsafe.apps.auth.middleware.AgaveTokenRefreshMiddleware']

# No pipeline please
PIPELINE_ENABLED = False

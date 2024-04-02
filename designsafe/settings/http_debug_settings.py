import warnings

# Turn on warnings for debugging!
warnings.simplefilter('module')

from designsafe.common_settings import *

SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SITE_ID = 1

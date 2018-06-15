import os

if os.environ.get("PORTAL_TESTING", 'false').lower() == 'true':
    from .test_settings import *
else:
    print "WTF"*1000
    from .common import *
    from .celery_settings import *
    from .elasticsearch_settings import *
    from .external_resource_settings import *
    from .nees_settings import *
    from .rt_settings import *

from django.conf import settings
print settings.ES_CONNECTIONS
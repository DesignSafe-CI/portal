"""
WSGI config for designsafe project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/1.8/howto/deployment/wsgi/
"""

import os

from django.core.wsgi import get_wsgi_application

# This will make sure the app is always imported when
# Django starts so that shared_task will use this app.
from designsafe.celery import app as celery_app #pylint:disable=unused-import

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "designsafe.settings")

application = get_wsgi_application()

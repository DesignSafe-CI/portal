"""Desingsafe.
"""
__version__ = "v4.6.1-20190901"

from __future__ import absolute_import

# This will make sure the app is always imported when
# Django starts so that shared_task will use this app.
from .celery import app as celery_app  # noqa

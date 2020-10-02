"""Utilities to manage the restheart service.

.. module:: designsafe.apps.api.restheart.utils
"""
import logging
import pymongo
from django.conf import settings
from pymongo import MongoClient

logger = logging.getLogger(__name__)

def mongo_client():
    """Return restheart client instance."""
    # get rid of this.. we're not using pymongo...
    # Talk with Steve Terry to see how we can initialize an agavepy client to
    # interact with the new v3meta database/collections
    return MongoClient(
        host=settings.RESTHEART_CLIENT_HOST,
        baseurl=settings.RESTHEART_CLIENT_BASEURL,
        token=settings.RESTHEART_CLIENT_TOKEN
    )

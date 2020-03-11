"""Utilities to manage mongodb.

.. module:: designsafe.apps.api.mongodb.utils
"""
import logging
import pymongo
from django.conf import settings
from pymongo import MongoClient

logger = logging.getLogger(__name__)

def mongo_client():
    """Return mongo client instance."""
    return MongoClient(
        host=settings.MONGO_CLIENT_HOST,
        username=settings.MONGO_CLIENT_USER,
        password=settings.MONGO_CLIENT_PASS,
        authSource=settings.MONGO_CLIENT_AUTH,
        port=int(settings.MONGO_CLIENT_PORT)
    )

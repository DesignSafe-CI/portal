"""Mongo ttc grants helper.

.. module:: designsafe.libs.mongo.load_ttc_grants
    :synopsis: utilities to load projects into mongo.
    These utilities should only be used for the NCO Scheduler.
"""
import logging
from pymongo import MongoClient, DESCENDING, ASCENDING
from django.conf import settings


logger = logging.getLogger(__name__)


class MongoTTCHelper(object):
    """Class to abstract mongo calls."""

    def __init__(
            self, agave_client, user=None, password=None,
            host=None, port=None, database=None
    ):
        """Initialize instance."""
        user = user or getattr(settings, 'MONGO_USER')
        password = password or getattr(settings, 'MONGO_PASS')
        host = host or getattr(settings, 'MONGO_HOST')
        port = port or getattr(settings, 'MONGO_PORT', 27017)
        database = database or getattr(settings, 'MONGO_DB', 'scheduler')
        self._ac = agave_client
        self._mc = self._mongo_client(user, password, host, port, database)

    def _mongo_client(self, user, password, host, port, database):
        """Create mongo client."""
        return MongoClient(
            "mongodb://{user}:{password}@{host}:{port}/{database}".format(
                user=user,
                password=password,
                host=host,
                port=port,
                database=database
            )
        )

    def get_ttc_grants(self, query=None, sort=None):
        """List grants stored in mongodb.

        :param dict query: A query string to pass to mongo.
        :param int page_size: Page size.
        :param hex last_id: Last mongo id.
        """
        query = query or {}

        #set sorting option
        final_sort = []
        if sort == "Start Date Descending":
            final_sort = [('StartDate', DESCENDING)]
        elif sort == "Start Date Ascending":
            final_sort = [('StartDate', ASCENDING)]
        elif sort == "End Date Descending":
            final_sort = [('EndDate', DESCENDING)]
        elif sort == "End Date Ascending":
            final_sort = [('EndDate', ASCENDING)]
        else:
            final_sort = [('StartDate', DESCENDING)]

        mongo_db = self._mc[getattr(settings, 'MONGO_DB', 'scheduler')]
        cursor = mongo_db.ttc_grant.find(query).sort(final_sort)
        results = list(cursor)
        for grant in results:
            yield grant

    def get_ttc_facilities(self):
        """Get unique facilities in the ttc grants db"""

        mongo_db = self._mc[getattr(settings, 'MONGO_DB', 'scheduler')]
        cursor = mongo_db.ttc_grant.distinct('NheriFacility')
        results = list(cursor)
        for facility in results:
            yield facility

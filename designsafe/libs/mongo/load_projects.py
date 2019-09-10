"""Mongo projects helper.

.. module:: designsafe.libs.mongo.load_projects
    :synopsis: utilities to load projects into mongo.
    These utilities should only be used for the NCO Scheduler.
"""
import logging
from pymongo import MongoClient
from django.conf import settings


LOG = logging.getLogger(__name__)


class MongoProjectsHelper(object):
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

    def import_project_to_mongo(self, prj_dict):
        """Insert a project from agave metadata to mongo.

        :param dict prj_dict: Project dict.
        """
        ents = prj_dict.pop('entities', [])
        results = []
        for ent in ents:
            proc_start = ent.get('procedureStart')
            date_start = ent.get('dateStart')
            event_start = prj_dict.get('nhEventStart')
            date_start = proc_start or date_start or event_start
            if not date_start:
                continue
            proc_end = ent.get('procedureEnd')
            date_end = ent.get('dateEnd')
            event_end = ent.get('nhEventEnd')
            date_end = proc_end or date_end or event_end
            entity = {
                "uuid": ent["uuid"],
                "title": prj_dict['title'],
                "projectId": prj_dict["projectId"],
                "prjDesc": prj_dict["description"],
                "eventTitle": ent["title"],
                "eventDesc": ent["description"],
                "dateStart": date_start,
                "dateEnd": date_end,
                "facility": ent.get("experimentalFacility"),
                "location": ent.get("location"),
                "project": prj_dict,
                "event": ent,
            }
            mongo_db = self._mc[getattr(settings, 'MONGO_DB', 'scheduler')]
            mongo_collection = mongo_db[getattr(settings, 'MONGO_PRJ_COLLECTION', 'projects')]
            result = mongo_collection.find_one_and_replace(
                {"uuid": ent['uuid']},
                entity,
                upsert=True
            )
            results.append(result)
        return results

    def list_events(self, query=None, page_size=5, page_number=0, sort=None):
        """List projects stored in mongodb.

        :param dict query: A query string to pass to mongo.
        :param int page_size: Page size.
        :param hex last_id: Last mongo id.
        """
        query = query or {}
        sort = sort or [("_id", 1)]
        mongo_db = self._mc[getattr(settings, 'MONGO_DB', 'scheduler')]
        mongo_collection = mongo_db[getattr(settings, 'MONGO_PRJ_COLLECTION', 'projects')]
        offset = page_size * page_number
        LOG.debug("%s, %s, %s, %s", query, sort, offset, page_size)
        cursor = mongo_collection.find(query).sort(sort).skip(offset).limit(page_size)
        for event in cursor:
            yield event

    def count_events(self, query):
        """Count events in MongoDB.

        :param dict query: A mongo query.
        """
        mongo_db = self._mc[getattr(settings, 'MONGO_DB', 'scheduler')]
        mongo_collection = mongo_db[getattr(settings, 'MONGO_PRJ_COLLECTION', 'projects')]
        return mongo_collection.count_documents(query)

    def filters(self):
        """Return all filters."""
        mongo_db = self._mc[getattr(settings, 'MONGO_DB', 'scheduler')]
        cursor = mongo_db.filters.find()
        return [
            doc for doc in cursor
        ]

    def _update_filter(self, name, value):
        """Update or create filter doc stored in mognodb.

        :param str name: Name of the filter.
            One of: ["facilities", "places", "instruments"]
        """
        mongo_db = self._mc[getattr(settings, 'MONGO_DB', 'scheduler')]
        col = mongo_db.filters
        filter_doc = {
            "name": name,
            "value": value,
        }
        result = col.find_one_and_replace(
            {"name": name},
            filter_doc,
            upsert=True
        )
        return result

    def update_facilities_filter(self):
        """Update facilities filter.

        Loops through all the documents in `scheduler.projects` and, extracts
        and dedups the experimental facilities to create a list.
        The experimental facilities are then saved onto a document into the
        `scheduler.filters` collection.
        """
        facilities = []
        for doc in self.list_events():
            facilities.append(doc["facility"])
        facilities = list(set(facilities))
        return self._update_filter("facilities", facilities)

    def update_locations_filter(self):
        """Update locations filter.

        Loops through all the documents in `scheduler.projects` and, extracts
        and dedups the locations to create a list.
        The locations are then saved onto a document into the
        `scheduler.filters` collection.
        """
        locations = []
        for doc in self.list_events():
            locations.append(doc["location"])
        locations = list(set(locations))
        return self._update_filter("locations", locations)

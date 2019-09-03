"""Mongo projects helper.

.. module:: designsafe.libs.mongo.load_projects
    :synopsis: utilities to load projects into mongo.
    These utilities should only be used for the NCO Scheduler.
"""
import six
import logging
from dateutil.parser import parse as datetime_parse
from pymongo import MongoClient
from django.conf import settings
from designsafe.apps.projects.managers.base import ProjectsManager


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
        self._pm = ProjectsManager(self._ac)

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

    def _parse_datetime(self, doc):
        """Parse any string into a datetime obj."""
        for key in doc:
            if not isinstance(doc[key], six.string_types):
                continue
            try:
                dt = datetime_parse(doc[key])
                doc[key] = dt
            except ValueError:
                pass
        return doc

    def project_id_to_json(self, prj_id):
        """Given a project id return a JSON obj.

        The JSON objec returned will be the nested object
        stored in the Agave's metadata `value` field.

        :param str project_id: Project id
        """
        prj = self._pm.get_project_by_id(prj_id)
        entities = []
        related = None
        if prj.project_type == 'experimental':
            related = prj.experiment_set
        if prj.project_type == 'simulation':
            related = prj.simulation_set
        if prj.project_type == 'hybrid_simulation':
            related = prj.hybridsimulation_set
        if prj.project_type == 'field_recon':
            related = prj.mission_set

        if related:
            entities = [
                self._parse_datetime(ent.to_body_dict()['value'])
                for ent in related(self._ac)
            ]
        prj_dict = prj.to_body_dict()['value']
        prj_dict['entities'] = entities
        return prj_dict

    def import_project_to_mongo(self, prj_id):
        """Insert a project from agave metadata to mongo.

        :param str prj_id: Porject's id.
        """
        prj_json = self.project_id_to_json(prj_id)
        mongo_db = self._mc[getattr(settings, 'MONGO_DB', 'scheduler')]
        mongo_collection = mongo_db[getattr(settings, 'MONGO_PRJ_COLLECTION', 'projects')]
        result = mongo_collection.find_one_and_replace(
            {'projectId': prj_id},
            prj_json,
            upsert=True
        )
        return result

    def list_projects(self, query=None, page_size=10, last_id=None):
        """List projects stored in mongodb.

        :param dict query: A query string to pass to mongo.
        :param int page_size: Page size.
        :param hex last_id: Last mongo id.
        """
        query = query or {}
        mongo_db = self._mc[getattr(settings, 'MONGO_DB', 'scheduler')]
        mongo_collection = mongo_db[getattr(settings, 'MONGO_PRJ_COLLECTION', 'projects')]
        done = False
        while not done:
            proj = {}
            if last_id:
                query.update({"_id": {"$gt": last_id}})

            cursor = mongo_collection.find(query).limit(page_size)
            for proj in cursor:
                yield proj
            last_id = proj.get('_id', None)
            done = not proj

    def project_and_dates(self, query=None, page_size=10, last_id=None):
        """Return project titles and start/end dates."""
        for prj in self.list_projects():
            if not prj.get('entities'):
                continue
            for ent in prj.get('entities', []):
                date_start = ent.get('procedureStart', ent.get('dateStart'))
                if not date_start:
                    continue
                date_end = ent.get('proecudeEnd', ent.get('dateEnd'))
                yield {
                    "title": prj['title'],
                    "id": prj["projectId"],
                    "prj_desc": prj["description"],
                    "event_title": ent["title"],
                    "event_desc": ent["description"],
                    "date_start": date_start,
                    "date_end": date_end,
                    "facility": ent.get("experimental_facility")
                }

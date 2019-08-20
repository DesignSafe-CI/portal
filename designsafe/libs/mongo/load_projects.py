"""
.. module:: designsafe.libs.mongo.load_projects
    :synopsis: utilities to load projects into mongo.
"""
import json
import logging
from pymongo import MongoClient
from django.conf import settings
from designsafe.apps.projects.models.utils import lookup_model as project_lookup_model


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

    def project_by_id(self, prj_id):
        """Retrieve a project by project id.

        :param str proj_id: Project Id.
        """
        resp = self._ac.meta.listMetadata(q=json.dumps({'value.projectId': prj_id}))
        if not resp:
            raise ValueError("Nothing came back.")

        prj = project_lookup_model(resp[0])(**resp[0])
        return prj

    def project_id_to_json(self, prj_id):
        """Given a project id return a JSON obj.

        The JSON objec returned will be the nested object
        stored in the Agave's metadata `value` field.

        :param str project_id: Project id
        """
        prj = self.project_by_id(prj_id)
        return prj.to_body_dict()['value']

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

"""Nco projects manager.

.. module:: designsafe.apps.nco.managers.projects
    :synopsis: Nco projects manager. Should only do read actions.
    Unless it is to update the mongo database.
"""
import logging
from designsafe.libs.mongo.load_projects import MongoProjectsHelper
from designsafe.apps.api.agave import service_account


LOG = logging.getLogger(__name__)


class NcoProjectsManager(object):
    """Nco Projects Manager."""

    def __init__(self, user):
        """Initialize.

        :param user: Django user instance.
        """
        self.user = user
        if user.is_authenticated:
            self.agave_client = user.agave_oauth.client
            self.mrg = MongoProjectsHelper(user.agave_oauth.client)
        else:
            self.agave_client = service_account()
            self.mrg = MongoProjectsHelper(service_account())

    def projects(self):
        """Return projects list."""
        return self.mrg.project_and_dates()

"""Nco projects manager.

.. module:: designsafe.apps.nco.managers.projects
    :synopsis: Nco projects manager. Should only do read actions.
    Unless it is to update the mongo database.
"""
from __future__ import unicode_literals, absolute_import
import six
import logging
from datetime import datetime, timedelta
import calendar
from dateutil.parser import parse as datetime_parse
from designsafe.libs.mongo.load_ttc_grants import MongoTTCHelper
from designsafe.apps.api.agave import service_account


logger = logging.getLogger(__name__)


class NcoTtcGrantsManager(object):
    """Nco TTC Grants Manager."""

    def __init__(self, user):
        """Initialize.

        :param user: Django user instance.
        """
        self.user = user
        if user.is_authenticated:
            self._ac = user.agave_oauth.client
        else:
            self._ac = service_account()

        self._mttc = MongoTTCHelper(self._ac)

    def ttc_grants(self, filters=None, page_number=0, sorts=None, page_size=10):
        """Return ttc grants list."""
        query = {}
        grants = [grant for grant in self._mttc.get_ttc_grants(query=query)]
        return grants

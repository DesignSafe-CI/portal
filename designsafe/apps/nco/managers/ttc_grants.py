"""Nco ttc grants manager.

.. module:: designsafe.apps.nco.managers.ttc_grants
    :synopsis: Nco ttc_grants manager. Should only do read actions.
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

    def ttc_grants(self, facility=None, sort=None):
        """Return ttc grants list."""
        query = {}

        #turn facility selection into query
        if facility:
            query = { 'NheriFacility' : facility }

        #get the grants list
        grants = [grant for grant in self._mttc.get_ttc_grants(query=query,sort=sort)]
        return grants

    def ttc_facilities(self):
        """Return list of distinct facilities in ttc_grant collection"""
        facilities = [facility for facility in self._mttc.get_ttc_facilities()]
        return facilities

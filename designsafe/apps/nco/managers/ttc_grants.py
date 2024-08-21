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
        self._ac = service_account()

        self._mttc = MongoTTCHelper(self._ac)

    def ttc_grants(self, params=None):
        """Return ttc grants list."""
        query = {}

        #turn facility and category selection into query
        if params['facility']:
            query['NheriFacility'] = params['facility']
        if params['hazard_type']:
            query['Hazard'] = params['hazard_type']
        if params['grant_type']:
            query['Type'] = params['grant_type']
        if params['text_search']:
            query['$or'] = [
                {'Title': {'$regex': params['text_search']}},
                {'Abstract': {'$regex': params['text_search']}},
                {'PiName': {'$regex': params['text_search']}},
            ]

        #get the grants list
        grants = [grant for grant in self._mttc.get_ttc_grants(query=query,sort=params['sort'])]
        return grants

    def ttc_facilities(self):
        """Return list of distinct facilities in ttc_grant collection"""
        facilities = [facility for facility in self._mttc.get_ttc_facilities()]
        return facilities

    def ttc_hazard_types(self):
        """Return list of hazard types in ttc_grant collection"""
        hazard_types = [hazard_type for hazard_type in self._mttc.get_ttc_hazard_types()]
        return hazard_types

    def ttc_grant_types(self):
        """return list of grant types in ttc_grant collection"""
        grant_types = [grant_type for grant_type in self._mttc.get_ttc_grant_types()]
        return grant_types
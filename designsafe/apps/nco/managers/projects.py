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
from designsafe.libs.mongo.load_projects import MongoProjectsHelper
from designsafe.apps.projects.managers.base import ProjectsManager
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
            self._ac = user.agave_oauth.client
        else:
            self._ac = service_account()

        self._mp = MongoProjectsHelper(self._ac)
        self._pm = ProjectsManager(self._ac)

    def _process_time_filter(self, value):
        """Convert from time filter value to date range."""
        date = datetime.utcnow()

        def this_week():
            """Get this week range."""
            start = date - timedelta(days=date.weekday())
            end = start + timedelta(days=6)
            return {"dateStart": {"$gt": start, "$lt": end}}

        def this_month():
            """Get this month range."""
            month_range = calendar.monthrange(date.year, date.month)
            start = date - timedelta(days=date.day - 1)
            end = start + timedelta(days=month_range[1] - 1)
            return {"dateStart": {"$gt": start, "$lt": end}}

        def last_n_days(days):
            """Last N days range."""
            def last_range():
                start = date - timedelta(days=days)
                end = date
                return {"dateStart": {"$gt": start, "$lt": end}}
            return last_range

        def in_n_days(days):
            """In N days range."""
            def in_range():
                start = date + timedelta(days=days)
                end = date
                return {"dateStart": {"$gt": start, "$lt": end}}
            return in_range

        range_switch = {
            "Happening This Week": this_week,
            "Happening This Month": this_month,
            "Event Started Last 7 Days": last_n_days(7),
            "Event Started Last 14 Days": last_n_days(14),
            "Event Started Last 30 Days": last_n_days(30),
            "Event Started Last 90 Days": last_n_days(90),
            "Event Will Start in 7 Days": in_n_days(7),
            "Event Will Start in 14 Days": in_n_days(14),
            "Event Will Start in 30 Days": in_n_days(30),
            "Event Will Start in 90 Days": in_n_days(90),
        }
        return range_switch[value]()

    def _process_filters(self, filters):
        """Create mongo query from filters dict.

        :param lsit query: Query as key/value,
            e.g. [{"name": "facility",  "value": "facility name"}, ...]
        """
        if not filters:
            return {}

        query = {}
        for fil in filters:
            if fil["name"] == "Facility":
                query["facility"] = fil["value"]
            elif fil["name"] == "locations":
                query["location"] = fil["value"]
            elif fil["name"] == "time":
                query.update(self._process_time_filter(fil["value"]))

        return query

    def _process_sort(self, sorts):
        """Create mongo sort from sorting value.

        :param list sorts: Sort as key/value.
            e.g. [{"name": "sort key", "value": 1}, ...].
        """
        sort_switch = {
            "Project Id A-Z": ("projectId", 1),
            "Event Title A-Z": ("eventTitle", 1),
            "Start Date - newest first": ("dateStart", -1),
            "Start Date - oldest first": ("dateStart", 1),
            "Award Number": ("awardNumber", 1),
            "Facility": ("facility", 1),
            "PI Name": ("piName", 1),
        }
        return [
            sort_switch[val] for val in sorts
        ]

    def projects(self, filters=None, page_number=0, sorts=None, page_size=10):
        """Return projects list."""
        filters = filters or []
        sorts = sorts or []
        query = self._process_filters(filters)
        sort = self._process_sort(sorts)
        prjs = [prj for prj in self._mp.list_events(
            query=query,
            sort=sort,
            page_number=page_number,
            page_size=page_size)]
        total = self._mp.count_events(query)
        return total, prjs

    def update_saved_projects(self):
        """Update saved projects in MongoDB.

        First, it loops through all the documents saved in MongoDB
        and keeps a list of all the project ids. Then, it get
        the project data from Agave.
        """
        ids = set()
        for doc in self.projects():
            ids.add(doc["projectId"])
            self._mp._mc.scheduler.projects.delete_many({"projectId": doc["projectId"]})
        for prj_id in ids:
            self.save_projct_to_mongo(prj_id)

    def save_projct_to_mongo(self, prj_id):
        """Save project from Agave to mongo.

        :param str prj_id: Agave's prj id.
        """
        prj = self._project_id_to_dict(prj_id)
        return self._mp.import_project_to_mongo(prj)

    def _project_id_to_dict(self, prj_id):
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
                self._process_entity(ent)
                for ent in related(self._ac)
            ]
        prj_dict = prj.to_body_dict()['value']
        prj_dict['entities'] = entities
        return prj_dict

    def _process_entity(self, entity):
        """Process entity."""
        doc = entity.to_body_dict()["value"]
        doc = self._parse_datetime(doc)
        doc["uuid"] = entity.uuid
        return doc

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

    def filters(self):
        """Return a list of possible filters."""
        return self._mp.filters()

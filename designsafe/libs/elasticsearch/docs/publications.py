"""ES publication doc.

.. module:: portal.libs.elasticsearch.docs.files
   :synopsis: Wrapper classes for ES ``files`` doc type.
"""

import logging

from designsafe.apps.data.models.elasticsearch import IndexedPublication
from designsafe.libs.elasticsearch.docs.base import BaseESResource
from designsafe.libs.elasticsearch.exceptions import DocumentNotFound
from django.contrib.auth import get_user_model

# pylint: disable=invalid-name
logger = logging.getLogger(__name__)
# pylint: enable=invalid-name


class BaseESPublication(BaseESResource):
    """Wrapper class for Elastic Search indexed publication.

    .. rubric:: Rationale

    This wrapper class is needed in order to separate concerns.
    Any thing specific to Elastic Search must live in
    :mod:`libs.elasticsearch.docs.base` and any logic needed
    to manipulate data must live here.
    Also, by manipulating data outside a ``DocType`` subclass
    we avoid the use of ``AttrDict`` and ``AttrList``.

    """

    def __init__(
        self,
        wrapped_doc=None,
        project_id=None,
        revision=None,
        using="default",
        **kwargs
    ):
        """Elastic Search File representation.

        This class directly wraps an Agave indexed file.

        """
        super(BaseESPublication, self).__init__(wrapped_doc, **kwargs)

        if not wrapped_doc:
            self._populate(project_id, revision=revision, using=using, **kwargs)

    def _populate(self, project_id, revision=None, using="default", **kwargs):

        try:
            wrapped_doc = self._index_cls.from_id(
                project_id, revision=revision, using=using
            )
            self._wrap(wrapped_doc, **kwargs)
        except DocumentNotFound:
            self._wrapped = self._index_cls(project_id=project_id, **dict(kwargs))

    @property
    def _index_cls(self):
        return IndexedPublication

    def save(
        self, using="default", index=None, validate=True, **kwargs
    ):  # pylint: disable=unused-argument
        """Save document."""
        self._wrapped.save(using=using)

    def delete(self, using="default"):
        """Delete."""
        self._wrapped.delete(using=using)

    @staticmethod
    def hit_to_file(hit):
        dict_obj = {
            "agavePath": "agave://designsafe.storage.published/{}".format(
                hit.project.value.projectId
            ),
            "children": [],
            "deleted": False,
            "format": "folder",
            "length": 24731027,
            "meta": {
                "title": hit.project["value"]["title"],
                "pi": hit.project["value"]["pi"],
                "dateOfPublication": hit.created,
                "type": hit.project["value"]["projectType"],
                "projectId": hit.project["value"]["projectId"],
                "keywords": hit.project["value"]["keywords"],
                "description": hit.project["value"]["description"],
            },
            "name": hit.project.value.projectId,
            "path": "/{}".format(hit.project.value.projectId),
            "permissions": "READ",
            "project": hit.project.value.projectId,
            "system": "designsafe.storage.published",
            "systemId": "designsafe.storage.published",
            "type": "dir",
            "version": getattr(hit, "version", 1),
        }
        if "dataType" in hit.project["value"]:
            dict_obj["meta"]["dataType"] = hit.project["value"]["dataType"]
        pi = hit.project["value"]["pi"]
        pi_user = [x for x in getattr(hit, "users", []) if x["username"] == pi]
        if pi_user:
            pi_user = pi_user[0]
            dict_obj["meta"]["piLabel"] = "{last_name}, {first_name}".format(
                last_name=pi_user["last_name"], first_name=pi_user["first_name"]
            )
        else:
            try:
                pi_user = get_user_model().objects.get(username=pi)
                dict_obj["meta"]["piLabel"] = "{last_name}, {first_name}".format(
                    last_name=pi_user.last_name, first_name=pi_user.first_name
                )
            except:
                dict_obj["meta"]["piLabel"] = "({pi})".format(pi=pi)
        return dict_obj

    def to_file(self):
        """To file."""
        dict_obj = {
            "agavePath": "agave://designsafe.storage.published/{}".format(
                self.project.value.projectId
            ),
            "children": [],
            "deleted": False,
            "format": "folder",
            "length": 24731027,
            "meta": {
                "title": self.project["value"]["title"],
                "pi": self.project["value"]["pi"],
                "dateOfPublication": self.created,
                "type": self.project["value"]["projectType"],
                "projectId": self.project["value"]["projectId"],
                "keywords": self.project["value"]["keywords"],
                "description": self.project["value"]["description"],
            },
            "name": self.project.value.projectId,
            "path": "/{}".format(self.project.value.projectId),
            "permissions": "READ",
            "project": self.project.value.projectId,
            "system": "designsafe.storage.published",
            "systemId": "designsafe.storage.published",
            "type": "dir",
            "version": getattr(self, "version", 1),
        }
        if "dataType" in self.project["value"]:
            dict_obj["meta"]["dataType"] = self.project["value"]["dataType"]
        pi = self.project["value"]["pi"]
        pi_user = [x for x in getattr(self, "users", []) if x["username"] == pi]
        if pi_user:
            pi_user = pi_user[0]
            dict_obj["meta"]["piLabel"] = "{last_name}, {first_name}".format(
                last_name=pi_user["last_name"], first_name=pi_user["first_name"]
            )
        else:
            try:
                pi_user = get_user_model().objects.get(username=pi)
                dict_obj["meta"]["piLabel"] = "{last_name}, {first_name}".format(
                    last_name=pi_user.last_name, first_name=pi_user.first_name
                )
            except:
                dict_obj["meta"]["piLabel"] = "({pi})".format(pi=pi)
        return dict_obj

    def entity_keys(self, publishable=False):
        """Type specific keys for publication"""
        prj_type = self.project.value.projectType
        if prj_type == "experimental":
            if publishable:
                return ["experimentsList"]
            return [
                "experimentsList",
                "modelConfigs",
                "analysisList",
                "sensorLists",
                "eventsList",
                "reportsList",
            ]
        elif prj_type == "simulation":
            if publishable:
                return ["simulations"]
            return [
                "simulations",
                "models",
                "inputs",
                "outputs",
                "analysiss",
                "reports",
            ]
        elif prj_type == "hybrid_simulation":
            if publishable:
                return ["hybrid_simulations"]
            return [
                "hybrid_simulations",
                "global_models",
                "coordinators",
                "sim_substructures",
                "exp_substructures",
                "coordinator_outputs",
                "sim_outputs",
                "exp_outputs",
                "reports",
                "analysiss",
            ]
        elif prj_type == "field_recon":
            if publishable:
                return ["missions", "reports"]
            return [
                "missions",
                "reports",
                "collections",
                "socialscience",
                "planning",
                "geoscience",
            ]
        else:
            return []

    def entities(self):
        """Entity uuids"""
        dict_obj = self._wrapped.to_dict()
        uuids = []
        for key in self.entity_keys():
            if key in dict_obj:
                for ent in dict_obj[key]:
                    uuids.append(ent["uuid"])
        return uuids

    def related_file_paths(self):
        """File paths for published files"""
        dict_obj = self._wrapped.to_dict()
        related_objs = []
        for key in self.entity_keys():
            related_objs = related_objs + dict_obj.get(key, [])

        file_paths = []
        for obj in related_objs:
            if "fileObjs" in obj:
                for file_dict in obj["fileObjs"]:
                    file_paths.append(file_dict["path"])
        return file_paths

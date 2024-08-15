"""Base projects manager.

.. :module: designsafe.apps.projects.managers.base
    :synopsis: Base manager for projects.
"""
from __future__ import unicode_literals, absolute_import
import logging
import json
from future.utils import python_2_unicode_compatible
from designsafe.apps.projects.models.utils import lookup_model as project_lookup_model


LOG = logging.getLogger(__name__)


@python_2_unicode_compatible
class ProjectsManager(object):
    """Base projects manager."""

    def __init__(self, agave_client=None, user=None):
        """Initialize base projects manager.

        Can be initialized with a custom agave client or with a Django user object.

        :param agave_client: Cusotm agave client
        :param user: Django user object.
        """
        if not agave_client and not user:
            raise TypeError("Must specify one of 'agave_client' or 'user'.")

        self.user = user
        self._ac = agave_client
        if not self._ac and self.user:
            self._ac = self.user.agave_oauth.client

    def get_project_by_id(self, project_id):
        """Get project by ID.

        Returns a project instance using the correct project class based
        on a project id.

        :param str project_id: Project id.
        :return: Project instance.
        """
        metas = self._ac.meta.listMetadata(
            q=json.dumps({"value.projectId": project_id})
        )
        assert metas, "No project with id: {project_id} found.".format(
            project_id=project_id
        )
        if len(metas) > 1:
            affected_uuids = []
            for meta in metas:
                affected_uuids.append(meta['uuid'])
            LOG.info(
                "More than one record with project id: {prj_id} found. "
                "Affected project UUIDs: {uuids}"
                .format(prj_id=project_id, uuids=affected_uuids)
            )

        prj_json = metas[0]
        prj_cls = project_lookup_model(prj_json)
        prj = prj_cls(**prj_json)
        prj.manager().set_client(self._ac)
        return prj

    def get_entity_by_uuid(self, entity_uuid):
        """Get entity by uuid.

        Returns an entity using the correct entity class based on a uuid.

        :param str entity_uuid: Entity uuid.
        :return: Entity instance.
        """
        entity_json = self._ac.meta.getMetadata(uuid=entity_uuid)
        entity_cls = project_lookup_model(entity_json)
        entity = entity_cls(**entity_json)
        entity.manager().set_client(self._ac)
        return entity

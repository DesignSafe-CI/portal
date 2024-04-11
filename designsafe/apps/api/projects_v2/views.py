"""Placeholder views module"""

import logging
import json
import networkx as nx
from django.http import HttpRequest, JsonResponse
from django.db import models
from designsafe.apps.api.views import BaseApiView, ApiException
from designsafe.apps.api.projects_v2.models.project_metadata import ProjectMetadata
from designsafe.apps.api.projects_v2.operations.graph_operations import (
    reorder_project_nodes,
    add_node_to_project,
    remove_nodes_from_project,
)
from designsafe.apps.api.projects_v2.operations.project_meta_operations import (
    patch_metadata,
    add_file_associations,
    remove_file_associations,
    set_file_tags,
)
from designsafe.apps.api.projects_v2.operations.project_publish_operations import (
    add_values_to_tree,
    validate_entity_selection,
)
from designsafe.apps.api.projects_v2.schema_models.base import FileObj


logger = logging.getLogger(__name__)


class ProjectsView(BaseApiView):
    """View for listing and creating projects"""

    def get(self, request: HttpRequest):
        """Return the list of projects for a given user."""
        offset = int(request.GET.get("offset", 0))
        limit = int(request.GET.get("limit", 100))
        # user = get_user_model().objects.get(username="ds_admin")
        user = request.user

        if not request.user.is_authenticated:
            raise ApiException("Unauthenticated user", status=401)

        projects = user.projects.order_by("last_updated")[offset : offset + limit]
        total = user.projects.count()

        project_json = {
            "result": [project.to_dict() for project in projects],
            "total": total,
        }

        return JsonResponse(project_json)

    def post(self, request: HttpRequest):
        """Create a new project."""


class ProjectInstanceView(BaseApiView):
    """View for listing/updating project entities."""

    def get(self, request: HttpRequest, project_id: str):
        """Return all project metadata for a project ID"""
        user = request.user
        if not request.user.is_authenticated:
            raise ApiException("Unauthenticated user", status=401)

        try:
            project = user.projects.get(
                models.Q(uuid=project_id) | models.Q(value__projectId=project_id)
            )
        except ProjectMetadata.DoesNotExist as exc:
            raise ApiException(
                "User does not have access to the requested project", status=403
            ) from exc

        entities = ProjectMetadata.objects.filter(base_project=project)
        return JsonResponse(
            {
                "baseProject": project.to_dict(),
                "entities": [e.to_dict() for e in entities],
                "tree": nx.tree_data(
                    nx.node_link_graph(project.project_graph.value), "NODE_ROOT"
                ),
            }
        )

    def patch(self, request: HttpRequest, project_id: str):
        """Update a project's root metadata"""
        user = request.user
        if not request.user.is_authenticated:
            raise ApiException("Unauthenticated user", status=401)

        try:
            project: ProjectMetadata = user.projects.get(
                models.Q(uuid=project_id) | models.Q(value__projectId=project_id)
            )
        except ProjectMetadata.DoesNotExist as exc:
            raise ApiException(
                "User does not have access to the requested project", status=403
            ) from exc

        request_body = json.loads(request.body).get("patchMetadata", {})
        patch_metadata(project.uuid, request_body)
        return JsonResponse({"result": "OK"})


class ProjectEntityView(BaseApiView):
    """View for updating individual project entities"""

    def patch(self, request: HttpRequest, entity_uuid: str):
        """Patch an entity's metadata value."""
        user = request.user
        if not request.user.is_authenticated:
            raise ApiException("Unauthenticated user", status=401)

        entity_meta = ProjectMetadata.objects.get(uuid=entity_uuid)
        if user not in entity_meta.base_project.users.all():
            raise ApiException(
                "User does not have access to the requested project", status=403
            )

        request_body = json.loads(request.body).get("patchMetadata", {})
        logger.debug(request_body)
        patch_metadata(entity_uuid, request_body)
        return JsonResponse({"result": "OK"})


class ProjectPreviewView(BaseApiView):
    """View for generating the Publication Preview"""

    def get(self, request: HttpRequest, project_id: str):
        """Return all project metadata for a project ID"""
        user = request.user
        if not request.user.is_authenticated:
            raise ApiException("Unauthenticated user", status=401)

        try:
            project = user.projects.get(
                models.Q(uuid=project_id) | models.Q(value__projectId=project_id)
            )
        except ProjectMetadata.DoesNotExist as exc:
            raise ApiException(
                "User does not have access to the requested project", status=403
            ) from exc
        entities = ProjectMetadata.objects.filter(base_project=project)
        preview_tree = add_values_to_tree(project.project_id)
        return JsonResponse(
            {
                "baseProject": project.to_dict(),
                "entities": [e.to_dict() for e in entities],
                "tree": nx.tree_data(preview_tree, "NODE_ROOT"),
            }
        )


class ProjectEntityOrderView(BaseApiView):
    """View for reordering project entities."""

    def put(self, request: HttpRequest, project_id: str):
        """Update a node's order in the project tree."""
        request_body = json.loads(request.body)
        user = request.user
        node_id = request_body.get("nodeId")
        order = request_body.get("order")

        if not node_id or order is None:
            raise ApiException("Node ID and new order must be specified", status=400)

        if not request.user.is_authenticated:
            raise ApiException("Unauthenticated user", status=401)

        try:
            project = user.projects.get(
                models.Q(uuid=project_id) | models.Q(value__projectId=project_id)
            )
        except ProjectMetadata.DoesNotExist as exc:
            raise ApiException(
                "User does not have access to the requested project", status=403
            ) from exc

        project_id = project.project_id
        reorder_project_nodes(project_id, node_id, order)
        return JsonResponse({"result": "OK"})


class ProjectEntityAssociationsView(BaseApiView):
    """View for managing associations in the project tree."""

    def post(self, request: HttpRequest, project_id, node_id):
        """Associate an entity as the child of the provided node ID."""

        request_body = json.loads(request.body)
        user = request.user
        entity_uuid = request_body.get("uuid")

        if not entity_uuid:
            raise ApiException("Entity UUID must be provided", status=400)

        if not request.user.is_authenticated:
            raise ApiException("Unauthenticated user", status=401)

        try:
            project = user.projects.get(
                models.Q(uuid=project_id) | models.Q(value__projectId=project_id)
            )
        except ProjectMetadata.DoesNotExist as exc:
            raise ApiException(
                "User does not have access to the requested project", status=403
            ) from exc

        entity_meta = ProjectMetadata.objects.get(
            uuid=entity_uuid, base_project=project
        )
        logger.debug(entity_meta)

        add_node_to_project(project.project_id, node_id, entity_uuid, entity_meta.name)

        return JsonResponse({"result": "OK"})

    def delete(self, request: HttpRequest, project_id, node_id):
        """Remove a node from the project tree."""
        user = request.user
        if not request.user.is_authenticated:
            raise ApiException("Unauthenticated user", status=401)

        try:
            project = user.projects.get(
                models.Q(uuid=project_id) | models.Q(value__projectId=project_id)
            )
        except ProjectMetadata.DoesNotExist as exc:
            raise ApiException(
                "User does not have access to the requested project", status=403
            ) from exc

        remove_nodes_from_project(project.project_id, node_ids=[node_id])

        return JsonResponse({"result": "OK"})


class ProjectFileAssociationsView(BaseApiView):
    """View for managing associations between entities and data files."""

    def post(self, request: HttpRequest, project_id, entity_uuid):
        """Associate one or more files to an entity"""
        file_obj_data: list[dict] = json.loads(request.body).get("fileObjs", [])
        file_objs = [
            FileObj(
                system=file_obj.get("system"),
                path=file_obj.get("path"),
                name=file_obj.get("name"),
                type=file_obj.get("type"),
                length=file_obj.get("length"),
                last_modified=file_obj.get("lastModified"),
            )
            for file_obj in file_obj_data
        ]

        user = request.user

        if not entity_uuid:
            raise ApiException("Entity UUID must be provided", status=400)

        if not request.user.is_authenticated:
            raise ApiException("Unauthenticated user", status=401)

        try:
            project = user.projects.get(
                models.Q(uuid=project_id) | models.Q(value__projectId=project_id)
            )
        except ProjectMetadata.DoesNotExist as exc:
            raise ApiException(
                "User does not have access to the requested project", status=403
            ) from exc

        try:
            ProjectMetadata.objects.get(uuid=entity_uuid, base_project=project)
        except ProjectMetadata.DoesNotExist as exc:
            raise ApiException(
                "Entity is not part of the specified project", status=400
            ) from exc

        logger.debug(file_objs)
        add_file_associations(entity_uuid, file_objs)
        return JsonResponse({"result": "OK"})

    def delete(self, request: HttpRequest, project_id, entity_uuid, file_path):
        """Remove the association between a file and an entity."""
        user = request.user

        if not entity_uuid:
            raise ApiException("Entity UUID must be provided", status=400)

        if not request.user.is_authenticated:
            raise ApiException("Unauthenticated user", status=401)

        try:
            project = user.projects.get(
                models.Q(uuid=project_id) | models.Q(value__projectId=project_id)
            )
        except ProjectMetadata.DoesNotExist as exc:
            raise ApiException(
                "User does not have access to the requested project", status=403
            ) from exc

        try:
            ProjectMetadata.objects.get(uuid=entity_uuid, base_project=project)
        except ProjectMetadata.DoesNotExist as exc:
            raise ApiException(
                "Entity is not part of the specified project", status=400
            ) from exc

        remove_file_associations(entity_uuid, [file_path])
        return JsonResponse({"result": "OK"})


class ProjectFileTagsView(BaseApiView):
    """View for managing file tags."""

    def put(self, request: HttpRequest, project_id, entity_uuid, file_path):
        """Set file tags for a given path/entity combination"""
        tag_names: list[str] = json.loads(request.body).get("tagNames")

        user = request.user

        if not entity_uuid:
            raise ApiException("Entity UUID must be provided", status=400)

        if not request.user.is_authenticated:
            raise ApiException("Unauthenticated user", status=401)

        try:
            project = user.projects.get(
                models.Q(uuid=project_id) | models.Q(value__projectId=project_id)
            )
        except ProjectMetadata.DoesNotExist as exc:
            raise ApiException(
                "User does not have access to the requested project", status=403
            ) from exc

        try:
            ProjectMetadata.objects.get(uuid=entity_uuid, base_project=project)
        except ProjectMetadata.DoesNotExist as exc:
            raise ApiException(
                "Entity is not part of the specified project", status=400
            ) from exc

        set_file_tags(entity_uuid, file_path, tag_names)
        return JsonResponse({"result": "OK"})


class ProjectEntityValidateView(BaseApiView):
    """Views for validating publishable entities."""

    def post(self, request: HttpRequest, project_id):
        """validate a selection of entities to check publication-readiness."""
        user = request.user
        if not request.user.is_authenticated:
            raise ApiException("Unauthenticated user", status=401)

        try:
            project: ProjectMetadata = user.projects.get(
                models.Q(uuid=project_id) | models.Q(value__projectId=project_id)
            )
        except ProjectMetadata.DoesNotExist as exc:
            raise ApiException(
                "User does not have access to the requested project", status=403
            ) from exc

        entities: list[str] = json.loads(request.body).get("entityUuids", None)

        validation_result = validate_entity_selection(project.project_id, entities)
        return JsonResponse({"result": validation_result})

"""Placeholder views module"""

import logging
import json
import networkx as nx
from django.http import HttpRequest, JsonResponse
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.db import models
from designsafe.apps.api.views import BaseApiView, ApiException
from designsafe.apps.api.projects_v2.models.project_metadata import ProjectMetadata
from designsafe.apps.api.projects_v2.schema_models.base import BaseProject
from designsafe.apps.api.projects_v2.tasks import alert_sensitive_data
from designsafe.apps.api.projects_v2.migration_utils.graph_constructor import (
    ALLOWED_RELATIONS,
)
from designsafe.apps.api.projects_v2 import constants
from designsafe.apps.api.projects_v2.operations.graph_operations import (
    reorder_project_nodes,
    add_node_to_project,
    remove_nodes_from_project,
    initialize_project_graph,
    remove_nodes_for_entity,
)
from designsafe.apps.api.projects_v2.operations.project_meta_operations import (
    patch_metadata,
    add_file_associations,
    set_file_associations,
    create_entity_metadata,
    delete_entity,
    remove_file_associations,
    set_file_tags,
    change_project_type,
    create_project_metdata,
    get_changed_users,
)
from designsafe.apps.api.projects_v2.operations.project_publish_operations import (
    add_values_to_tree,
    validate_entity_selection,
)
from designsafe.apps.api.projects_v2.operations.project_system_operations import (
    increment_workspace_count,
    setup_project_file_system,
    add_user_to_project_async,
    remove_user_from_project_async,
)
from designsafe.apps.api.projects_v2.schema_models.base import FileObj
from designsafe.apps.api.decorators import tapis_jwt_login


logger = logging.getLogger(__name__)


def get_search_filter(query_string):
    """
    Construct a search filter for projects.
    """
    id_filter = models.Q(value__projectId__icontains=query_string)
    title_filter = models.Q(value__title__icontains=query_string)
    desc_filter = models.Q(value__description__icontains=query_string)
    user_filter = models.Q(value__users__icontains=query_string)
    return id_filter | title_filter | desc_filter | user_filter


class ProjectsView(BaseApiView):
    """View for listing and creating projects"""

    @method_decorator(tapis_jwt_login)
    def get(self, request: HttpRequest):
        """Return the list of projects for a given user."""
        offset = int(request.GET.get("offset", 0))
        limit = int(request.GET.get("limit", 100))
        query_string = request.GET.get("q", None)
        # user = get_user_model().objects.get(username="ds_admin")
        user = request.user

        if not request.user.is_authenticated:
            raise ApiException("Unauthenticated user", status=401)

        projects = user.projects.order_by("-last_updated")
        if query_string:
            projects = projects.filter(get_search_filter(query_string))
        total = user.projects.count()

        project_json = {
            "result": [
                project.to_dict() for project in projects[offset : offset + limit]
            ],
            "total": total,
        }

        return JsonResponse(project_json)

    def post(self, request: HttpRequest):
        """Create a new project."""
        user = request.user
        if not request.user.is_authenticated:
            raise ApiException("Unauthenticated user", status=401)
        req_body = json.loads(request.body)
        metadata_value = req_body.get("value", {})
        # Projects are initialized as type None

        # increment project count
        prj_number = increment_workspace_count()
        # create metadata and graph
        metadata_value["projectType"] = "None"
        metadata_value["projectId"] = f"PRJ-{prj_number}"
        project_meta = create_project_metdata(metadata_value)
        initialize_project_graph(project_meta.project_id)
        project_users = [user.username for user in project_meta.users.all()]
        # create project system
        setup_project_file_system(project_uuid=project_meta.uuid, users=project_users)
        # add users to system

        return JsonResponse({"projectId": project_meta.project_id})


@method_decorator(csrf_exempt, name="dispatch")
class ProjectInstanceView(BaseApiView):
    """View for listing/updating project entities."""

    @method_decorator(tapis_jwt_login)
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

    def put(self, request: HttpRequest, project_id: str):
        """Update project type for a project ID"""
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

        # Get the new value from the request data
        req_body = json.loads(request.body)
        new_value = req_body.get("value", {})
        sensitive_data_option = req_body.get("sensitiveData", False)
        if sensitive_data_option:
            logger.debug("PROJECT %s INDICATES SENSITIVE DATA", project_id)
            alert_sensitive_data.apply_async([project_id, request.user.username])

        # Call the change_project_type function to update the project type
        updated_project = change_project_type(project_id, new_value)

        users_to_add, users_to_remove = get_changed_users(
            BaseProject.model_validate(project.value),
            BaseProject.model_validate(updated_project.value),
        )
        for user_to_add in users_to_add:
            add_user_to_project_async.apply_async([project.uuid, user_to_add])
        for user_to_remove in users_to_remove:
            remove_user_from_project_async.apply_async([project_id, user_to_remove])

        return JsonResponse({"result": "OK"})

    @method_decorator(tapis_jwt_login)
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
        prev_metadata = BaseProject.model_validate(project.value)
        updated_project = patch_metadata(project.uuid, request_body)
        updated_metadata = BaseProject.model_validate(updated_project.value)

        users_to_add, users_to_remove = get_changed_users(
            prev_metadata, updated_metadata
        )
        for user_to_add in users_to_add:
            add_user_to_project_async.apply_async([project.uuid, user_to_add])
        for user_to_remove in users_to_remove:
            remove_user_from_project_async.apply_async([project_id, user_to_remove])

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

    def delete(self, request: HttpRequest, entity_uuid: str):
        """Delete an entity's metadata and remove the entity from the graph"""
        user = request.user
        if not request.user.is_authenticated:
            raise ApiException("Unauthenticated user", status=401)

        entity_meta = ProjectMetadata.objects.get(uuid=entity_uuid)
        if user not in entity_meta.base_project.users.all():
            raise ApiException(
                "User does not have access to the requested project", status=403
            )

        remove_nodes_for_entity(entity_meta.project_id, entity_uuid)
        delete_entity(entity_uuid)
        return JsonResponse({"result": "OK"})

    def post(self, request: HttpRequest, project_id: str):
        """Add a new entity to a project"""

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

        req_body = json.loads(request.body)
        value = req_body.get("value", {})
        name = req_body.get("name", "")

        new_meta = create_entity_metadata(project.project_id, name, value)
        if name in ALLOWED_RELATIONS[constants.PROJECT]:
            add_node_to_project(project_id, "NODE_ROOT", new_meta.uuid, name)
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

    def patch(self, request: HttpRequest, project_id, entity_uuid):
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

        add_file_associations(entity_uuid, file_objs)
        return JsonResponse({"result": "OK"})

    def put(self, request: HttpRequest, project_id, entity_uuid):
        """Replace an entity's file associations with a new set."""
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

        set_file_associations(entity_uuid, file_objs)
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

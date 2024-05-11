"""Utilities for creating and managing project metadata objects/associations."""

import operator
from django.db import models, transaction
from designsafe.apps.api.projects_v2.schema_models import SCHEMA_MAPPING
from designsafe.apps.api.projects_v2.schema_models.base import (
    FileObj,
    FileTag,
    PartialEntityWithFiles,
    BaseProject,
)
from designsafe.apps.api.projects_v2 import constants
from designsafe.apps.api.projects_v2.models import ProjectMetadata
from designsafe.apps.api.projects_v2.operations import graph_operations


def create_project_metdata(value):
    """Create a project metadata object in the database."""
    schema_model = SCHEMA_MAPPING[constants.PROJECT]
    validated_model = schema_model.model_validate(value)

    project_db_model = ProjectMetadata(
        name=constants.PROJECT, value=validated_model.model_dump()
    )
    project_db_model.save()
    return project_db_model


def create_entity_metadata(project_id, name, value):
    """Create entity metadata associated with an existing project."""
    base_project = ProjectMetadata.get_project_by_id(project_id)
    schema_model = SCHEMA_MAPPING[name]
    validated_model = schema_model.model_validate(value)

    entity_db_model = ProjectMetadata(
        name=name, value=validated_model.model_dump(), base_project=base_project
    )
    entity_db_model.save()
    return entity_db_model


def patch_metadata(uuid, value):
    """Update an entity's `value` attribute. This method patches the metadata
    so that only fields in the payload are overwritten."""
    entity = ProjectMetadata.objects.get(uuid=uuid)
    schema_model = SCHEMA_MAPPING[entity.name]

    patched_metadata = {**entity.value, **value}
    validated_model = schema_model.model_validate(patched_metadata)
    entity.value = validated_model.model_dump()
    entity.save()
    return entity


def delete_entity(uuid: str):
    """Delete a non-root entity."""
    entity = ProjectMetadata.objects.get(uuid=uuid)
    if entity.name in (constants.PROJECT, constants.PROJECT_GRAPH):
        raise ValueError("Cannot delete a top-level project or graph object.")
    entity.delete()

    return "OK"


def clear_entities(project_id):
    """Delete all entities except the project root and graph. Used when changing project
    type, so that file associations don't get stuck on unreachable entities.
    """

    ProjectMetadata.get_entities_by_project_id(project_id).filter(
        ~models.Q(name__in=[constants.PROJECT, constants.PROJECT_GRAPH])
    ).delete()

    return "OK"


def get_changed_users(old_value: BaseProject, new_value: BaseProject):
    """
    Diff users between incoming and existing project metadata to determine which users
    need permissions to be added/removed via Tapis.
    """
    old_users = set(
        (u.username for u in old_value.users if u.username and u.role != "guest")
    )
    new_users = set(
        (u.username for u in new_value.users if u.username and u.role != "guest")
    )

    users_to_add = list(new_users - old_users)
    users_to_remove = list(old_users - new_users)

    return users_to_add, users_to_remove


def change_project_type(project_id, new_value):
    """Change the type of a project and update its value."""
    project = ProjectMetadata.get_project_by_id(project_id)
    schema_model = SCHEMA_MAPPING[constants.PROJECT]
    validated_model = schema_model.model_validate(new_value)
    project.value = validated_model.model_dump()
    project.save()
    clear_entities(project_id)
    graph_operations.initialize_project_graph(project_id)

    return project


def _merge_file_objs(
    prev_file_objs: list[FileObj], new_file_objs: list[FileObj]
) -> list[FileObj]:
    """Combine two arrays of FileObj models, overwriting the first if there are conflicts."""
    new_file_paths = [f.path for f in new_file_objs]
    deduped_file_objs = [fo for fo in prev_file_objs if fo.path not in new_file_paths]

    return sorted(
        [*deduped_file_objs, *new_file_objs], key=operator.attrgetter("name", "path")
    )


def _filter_file_objs(
    prev_file_objs: list[FileObj], paths_to_remove: list[str]
) -> list[FileObj]:
    return sorted(
        [fo for fo in prev_file_objs if fo.path not in paths_to_remove],
        key=operator.attrgetter("name", "path"),
    )


def add_file_associations(uuid: str, new_file_objs: list[FileObj]):
    """Associate one or more file objects to an entity."""
    # Use atomic transaction here to prevent multiple calls from clobbering each other
    with transaction.atomic():
        entity = ProjectMetadata.objects.select_for_update().get(uuid=uuid)
        entity_file_model = PartialEntityWithFiles.model_validate(entity.value)

        merged_file_objs = _merge_file_objs(entity_file_model.file_objs, new_file_objs)
        entity.value["fileObjs"] = [f.model_dump() for f in merged_file_objs]

        entity.save()
    return entity


def set_file_associations(uuid: str, new_file_objs: list[FileObj]):
    """Replace the file associations for an entity with the specified set."""
    # Use atomic transaction here to prevent multiple calls from clobbering each other
    with transaction.atomic():
        entity = ProjectMetadata.objects.select_for_update().get(uuid=uuid)
        entity.value["fileObjs"] = [f.model_dump() for f in new_file_objs]
        entity.save()
    return entity


def remove_file_associations(uuid: str, file_paths: list[str]):
    """Remove file associations from an entity by their paths."""
    with transaction.atomic():
        entity = ProjectMetadata.objects.select_for_update().get(uuid=uuid)
        entity_file_model = PartialEntityWithFiles.model_validate(entity.value)

        filtered_file_objs = _filter_file_objs(entity_file_model.file_objs, file_paths)
        entity.value["fileObjs"] = [f.model_dump() for f in filtered_file_objs]

        # Remove tags associated with these entity/file path combinations.
        tagged_paths = []
        for path in file_paths:
            tagged_paths += [
                t["path"]
                for t in entity.value.get("fileTags", [])
                if t["path"].startswith(path)
            ]
        entity.value["fileTags"] = [
            t
            for t in entity.value.get("fileTags", [])
            if not (t["path"] in tagged_paths)
        ]
        entity.save()
    return entity


def _check_file_tag_included(tag: FileTag, tag_list: list[FileTag]):
    return next(
        (t for t in tag_list if t.path == tag.path and t.tag_name == tag.tag_name),
        False,
    )


def _merge_file_tags(
    prev_file_tags: list[FileTag], new_file_tags: list[FileTag]
) -> list[FileTag]:
    deduped_file_tags = [
        tag
        for tag in prev_file_tags
        if not _check_file_tag_included(tag, new_file_tags)
    ]
    return [*deduped_file_tags, *new_file_tags]


def _filter_file_tags(
    prev_file_tags: list[FileTag], tags_to_remove: list[FileTag]
) -> list[FileTag]:
    return [
        tag
        for tag in prev_file_tags
        if not _check_file_tag_included(tag, tags_to_remove)
    ]


def add_file_tags(uuid: str, file_tags: list[FileTag]):
    """Add a file tag to an entity"""
    with transaction.atomic():
        entity = ProjectMetadata.objects.select_for_update().get(uuid=uuid)
        entity_file_model = PartialEntityWithFiles.model_validate(entity.value)
        # If a file with this path already exists, remove it from the list.

        entity.value["fileTags"] = [
            t.model_dump()
            for t in _merge_file_tags(entity_file_model.file_tags, file_tags)
        ]
        entity.save()
    return entity


def remove_file_tags(uuid: str, file_tags: list[FileTag]):
    """Remove file tags from an entity"""

    with transaction.atomic():
        entity = ProjectMetadata.objects.select_for_update().get(uuid=uuid)
        entity_file_model = PartialEntityWithFiles.model_validate(entity.value)
        # If a file with this path already exists, remove it from the list.

        entity.value["fileTags"] = [
            t.model_dump()
            for t in _filter_file_tags(entity_file_model.file_tags, file_tags)
        ]
        entity.save()
    return entity


def set_file_tags(uuid: str, file_path: str, file_tags: list[str]):
    """Set file tags for a specific path"""
    with transaction.atomic():
        entity = ProjectMetadata.objects.select_for_update().get(uuid=uuid)
        entity_file_model = PartialEntityWithFiles.model_validate(entity.value)

        unaffected_tags = [
            tag for tag in entity_file_model.file_tags if tag.path != file_path
        ]
        updated_tags = [FileTag(path=file_path, tag_name=tag) for tag in file_tags]
        tags_to_set = [*unaffected_tags, *updated_tags]
        entity.value["fileTags"] = [t.model_dump() for t in tags_to_set]
        entity.save()

    return entity

"""Utilities for ingesting projects using the ProjectMetadata db model."""
from pydantic import ValidationError
import networkx as nx
from designsafe.apps.api.projects_v2.models.project_metadata import ProjectMetadata
from designsafe.apps.api.projects_v2.migration_utils.graph_constructor import (
    get_entities_by_project_id,
    construct_graph_from_db,
)
from designsafe.apps.api.projects_v2.schema_models import SCHEMA_MAPPING
from designsafe.apps.api.projects_v2.tests.schema_integration import iterate_entities


def ingest_project_to_db(project_id):
    """Ingest all entities within a project into the database."""
    (base_project, *entities) = get_entities_by_project_id(project_id)

    base_model = SCHEMA_MAPPING[base_project["name"]].model_validate(
        base_project["value"]
    )
    db_base_model, _ = ProjectMetadata.objects.update_or_create(
        uuid=base_project["uuid"],
        name=base_project["name"],
        defaults={"value": base_model.model_dump(mode="json")},
    )
    db_base_model.save()
    for entity in entities:
        schema_model = SCHEMA_MAPPING.get(entity["name"], None)
        if not schema_model:
            continue
        value_model = schema_model.model_validate(entity["value"])

        ProjectMetadata.objects.update_or_create(
            uuid=entity["uuid"],
            name=entity["name"],
            defaults={
                "value": value_model.model_dump(mode="json"),
                "base_project": db_base_model,
            },
        )


def ingest_base_projects():
    """Ingest all top-level project metadata."""
    name = "designsafe.project"
    project_schema = SCHEMA_MAPPING["designsafe.project"]
    for project_meta in iterate_entities(name):
        value_model = project_schema.model_validate(project_meta["value"])
        ProjectMetadata.objects.update_or_create(
            uuid=project_meta["uuid"],
            name=project_meta["name"],
            defaults={
                "value": value_model.model_dump(mode="json"),
                "created": project_meta["created"],
            },
        )


def ingest_entities_by_name(name):
    """Ingest metadata entities under a given `name` field."""
    entities = iterate_entities(name)
    for entity in entities:
        schema_model = SCHEMA_MAPPING[entity["name"]]
        try:
            value_model = schema_model.model_validate(entity["value"])
        except ValidationError as err:
            print(entity)
            raise err
        try:
            prj = ProjectMetadata.objects.get(
                name="designsafe.project", uuid__in=entity["associationIds"]
            )
            ProjectMetadata.objects.update_or_create(
                uuid=entity["uuid"],
                name=entity["name"],
                defaults={
                    "value": value_model.model_dump(mode="json"),
                    "base_project": prj,
                    "created": entity["created"],
                    "association_ids": entity["associationIds"],
                },
            )
        except ProjectMetadata.DoesNotExist:
            print(entity["uuid"])


def ingest_sub_entities():
    """Ingest all entities other than base project metadata.
    Run AFTER ingesting projects."""
    for name in SCHEMA_MAPPING:
        if name != "designsafe.project":
            print(f"ingesting for type: {name}")
            ingest_entities_by_name(name)


def ingest_graphs():
    """Construct project graphs and ingest into the db.
    Run AFTER ingesting projects/entities"""

    base_projects = ProjectMetadata.objects.filter(name="designsafe.project")
    for project in base_projects:
        prj_graph = construct_graph_from_db(project.value["projectId"])
        graph_json = nx.node_link_data(prj_graph)

        ProjectMetadata.objects.update_or_create(
            name="designsafe.project.graph",
            base_project__uuid=project.uuid,
            defaults={"value": graph_json, "base_project": project},
        )

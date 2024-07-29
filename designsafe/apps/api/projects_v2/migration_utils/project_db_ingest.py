"""Utilities for ingesting projects using the ProjectMetadata db model."""

from datetime import datetime, timezone
from pydantic import ValidationError
from elasticsearch_dsl import Q
import networkx as nx
from designsafe.apps.api.projects_v2.models.project_metadata import ProjectMetadata
from designsafe.apps.api.projects_v2.migration_utils.graph_constructor import (
    get_entities_by_project_id,
    construct_graph_from_db,
    combine_pub_versions,
)
from designsafe.apps.api.projects_v2.schema_models import SCHEMA_MAPPING
from designsafe.apps.api.projects_v2.tests.schema_integration import (
    iterate_entities,
    iterate_pubs,
)
from designsafe.apps.api.projects_v2.operations.graph_operations import (
    _renormalize_ordering,
)
from designsafe.apps.api.publications_v2.models import Publication
from designsafe.apps.data.models.elasticsearch import IndexedPublication


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
        if entity["value"].get("fileObjs"):
            entity["value"]["fileObjs"] = [
                e for e in entity["value"]["fileObjs"] if e.get("path", None)
            ]
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
        prj_graph = _renormalize_ordering(prj_graph)
        graph_json = nx.node_link_data(prj_graph)

        ProjectMetadata.objects.update_or_create(
            name="designsafe.project.graph",
            base_project__uuid=project.uuid,
            defaults={"value": graph_json, "base_project": project},
        )


def fix_authors(meta: ProjectMetadata):
    """Ensure that authors contain complete name/institution information."""
    base_project = meta.base_project
    def get_complete_author(partial_author):
        if partial_author.get("name") and not partial_author.get("guest"):
            author_info = next(
                (
                    user
                    for user in base_project.value["users"]
                    if user["username"] == partial_author["name"]
                ),
                partial_author,
            )
            author_info.pop("order", None)
            return {**partial_author, **author_info}
        return partial_author

    if meta.value.get("authors"):
        meta.value["authors"] = [
            get_complete_author(author)
            for author in meta.value["authors"]
            if author.get("authorship", True) is True
        ]

    if meta.value.get("projectType") == "other":
        meta.value["authors"] = meta.value["users"]

    if meta.value.get("dataCollectors"):
        meta.value["dataCollectors"] = [
            get_complete_author(author)
            for author in meta.value["dataCollectors"]
            if author.get("authorship", True) is True
        ]
    schema_model = SCHEMA_MAPPING[meta.name]
    schema_model.model_validate(meta.value)
    meta.save()


def ingest_v2_projects():
    """Perform a complete ingest of Tapis V2 projects into the db."""
    ingest_base_projects()
    ingest_sub_entities()
    ingest_graphs()
    for meta in ProjectMetadata.objects.exclude(name="designsafe.project.graph"):
        fix_authors(meta)


def ingest_publications():
    """Ingest Elasticsearch-based publications into the db"""
    all_pubs = iterate_pubs()
    for pub in all_pubs:
        try:
            pub_graph = combine_pub_versions(pub["projectId"])
            latest_version: int = IndexedPublication.max_revision(pub["projectId"]) or 1
            pub_base = next(
                (
                    pub_graph.nodes[node_id]["value"]
                    for node_id in pub_graph
                    if (
                        pub_graph.nodes[node_id]["uuid"] == pub["project"]["uuid"]
                        and pub_graph.nodes[node_id].get("version", latest_version)
                        == latest_version
                    )
                ),
                None,
            )
            if not pub_base:
                raise ValueError("No pub base")
            pub_graph_json = nx.node_link_data(pub_graph)
            Publication.objects.update_or_create(
                project_id=pub["projectId"],
                defaults={
                    "created": datetime.fromisoformat(pub["created"]).replace(
                        tzinfo=timezone.utc
                    ),
                    "tree": pub_graph_json,
                    "value": pub_base,
                },
            )
        except ValidationError as exc:
            print(pub["projectId"])
            print(exc)


def ingest_tombstones():
    """Ingest Elasticsearch tombstones into the db"""

    tombstone_ids = [
        "PRJ-1945",
        "PRJ-1895",
        "PRJ-2329",
        "PRJ-2016",
        "PRJ-2227",
        "PRJ-2420",
        "PRJ-3815",
        "PRJ-3908",
        "PRJ-4151",
        "PRJ-4014",
    ]
    all_pubs = (
        IndexedPublication.search()
        .filter(
            Q("term", status="tombstone")
            | Q("terms", **{"projectId._exact": tombstone_ids})
        )
        .execute()
        .hits
    )
    print(all_pubs)
    for pub in all_pubs:
        try:
            pub_graph = combine_pub_versions(pub["projectId"])
            for published_entity_node_id in pub_graph.successors("NODE_ROOT"):
                pub_graph.nodes[published_entity_node_id]["value"]["tombstone"] = True
            latest_version: int = IndexedPublication.max_revision(pub["projectId"]) or 1
            pub_base = next(
                (
                    pub_graph.nodes[node_id]["value"]
                    for node_id in pub_graph
                    if (
                        pub_graph.nodes[node_id]["uuid"] == pub["project"]["uuid"]
                        and pub_graph.nodes[node_id].get("version", latest_version)
                        == latest_version
                    )
                ),
                None,
            )
            if not pub_base:
                raise ValueError("No pub base")
            pub_graph_json = nx.node_link_data(pub_graph)
            Publication.objects.update_or_create(
                project_id=pub["projectId"],
                defaults={
                    "is_published": False,
                    "created": datetime.fromisoformat(pub["created"]).replace(
                        tzinfo=timezone.utc
                    ),
                    "tree": pub_graph_json,
                    "value": pub_base,
                },
            )
        except ValidationError as exc:
            print(pub["projectId"])
            print(exc)

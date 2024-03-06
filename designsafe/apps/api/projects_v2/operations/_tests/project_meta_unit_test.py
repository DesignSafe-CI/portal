"""Tests for operations that create/update project metadata."""
import pytest
import networkx as nx
from django import db
from designsafe.apps.api.projects_v2 import constants
from designsafe.apps.api.projects_v2.operations.project_meta_operations import (
    create_project_metdata,
    create_entity_metadata,
    add_file_associations,
    remove_file_associations,
    add_file_tags,
    remove_file_tags,
    ProjectMetadata,
    FileObj,
    FileTag,
)
from designsafe.apps.api.projects_v2.operations.graph_operations import (
    initialize_project_graph,
    add_node_to_project,
    remove_nodes_from_project,
    reorder_project_nodes,
)


@pytest.mark.django_db
def test_project_meta_creation(project_admin_user):
    project_value = {"title": "Test Project", "projectId": "PRJ-1234"}
    prj_meta = create_project_metdata(project_value)

    assert prj_meta.value["projectId"] == "PRJ-1234"
    assert project_admin_user in prj_meta.users.all()

    with pytest.raises(db.IntegrityError):
        create_project_metdata(project_value)


@pytest.mark.django_db
def test_entity_creation(project_admin_user):
    project_value = {"title": "Test Project", "projectId": "PRJ-1234", "users": []}
    create_project_metdata(project_value)

    entity_meta = create_entity_metadata(
        "PRJ-1234",
        name="designsafe.project.experiment",
        value={"title": "My Experiment", "description": "Test Experiment"},
    )

    entity_obj = ProjectMetadata.objects.get(uuid=entity_meta.uuid)
    assert entity_obj.base_project.value["projectId"] == "PRJ-1234"
    assert ProjectMetadata.get_entities_by_project_id("PRJ-1234").count() == 2


@pytest.mark.django_db
def test_graph_init():
    project_value = {"title": "Test Project", "projectId": "PRJ-1234", "users": []}
    create_project_metdata(project_value)
    initialize_project_graph("PRJ-1234")

    graph_value = ProjectMetadata.get_project_by_id("PRJ-1234").project_graph.value
    nx_graph = nx.node_link_graph(graph_value)
    assert len(nx_graph) == 1
    assert nx_graph.nodes.get("NODE_ROOT")["name"] == "designsafe.project"


@pytest.mark.django_db
def test_graph_init_other():
    project_value = {
        "title": "Test Project",
        "projectId": "PRJ-1234",
        "users": [],
        "projectType": "other",
    }
    create_project_metdata(project_value)
    initialize_project_graph("PRJ-1234")

    graph_value = ProjectMetadata.get_project_by_id("PRJ-1234").project_graph.value
    nx_graph: nx.DiGraph = nx.node_link_graph(graph_value)
    assert len(nx_graph) == 2
    assert nx_graph.nodes.get("NODE_ROOT")["name"] == None


@pytest.mark.django_db
def test_graph_add_nodes():
    project_value = {
        "title": "Test Project",
        "projectId": "PRJ-1234",
        "users": [],
        "projectType": "experimental",
    }
    create_project_metdata(project_value)
    initialize_project_graph("PRJ-1234")

    new_node_1 = add_node_to_project(
        "PRJ-1234", "NODE_ROOT", "UUID1", constants.EXPERIMENT
    )
    new_node_2 = add_node_to_project(
        "PRJ-1234", new_node_1, "UUID2", constants.EXPERIMENT_MODEL_CONFIG
    )

    graph = ProjectMetadata.get_project_by_id("PRJ-1234").project_graph
    nx_graph: nx.DiGraph = nx.node_link_graph(graph.value)

    assert new_node_1 in nx_graph
    assert new_node_2 in nx_graph.successors(new_node_1)


@pytest.mark.django_db
def test_graph_remove_nodes():
    project_value = {
        "title": "Test Project",
        "projectId": "PRJ-1234",
        "users": [],
        "projectType": "experimental",
    }
    create_project_metdata(project_value)
    initialize_project_graph("PRJ-1234")

    new_node_1 = add_node_to_project(
        "PRJ-1234", "NODE_ROOT", "UUID1", constants.EXPERIMENT
    )
    new_node_2 = add_node_to_project(
        "PRJ-1234", new_node_1, "UUID2", constants.EXPERIMENT_MODEL_CONFIG
    )

    remove_nodes_from_project("PRJ-1234", [new_node_1])

    graph = ProjectMetadata.get_project_by_id("PRJ-1234").project_graph
    nx_graph: nx.DiGraph = nx.node_link_graph(graph.value)

    assert len(nx_graph.nodes) == 1
    assert new_node_1 not in nx_graph
    assert new_node_2 not in nx_graph


@pytest.mark.django_db
def test_graph_remove_nodes_renormalizes_order():
    project_value = {
        "title": "Test Project",
        "projectId": "PRJ-1234",
        "users": [],
        "projectType": "experimental",
    }
    create_project_metdata(project_value)
    initialize_project_graph("PRJ-1234")

    new_node_1 = add_node_to_project(
        "PRJ-1234", "NODE_ROOT", "UUID1", constants.EXPERIMENT
    )
    new_node_2 = add_node_to_project(
        "PRJ-1234", new_node_1, "UUID2", constants.EXPERIMENT_MODEL_CONFIG
    )
    new_node_3 = add_node_to_project(
        "PRJ-1234", new_node_1, "UUID3", constants.EXPERIMENT_MODEL_CONFIG
    )
    new_node_4 = add_node_to_project(
        "PRJ-1234", new_node_1, "UUID4", constants.EXPERIMENT_MODEL_CONFIG
    )

    graph = ProjectMetadata.get_project_by_id("PRJ-1234").project_graph
    nx_graph: nx.DiGraph = nx.node_link_graph(graph.value)
    assert nx_graph.nodes[new_node_2]["order"] == 0
    assert nx_graph.nodes[new_node_3]["order"] == 1
    assert nx_graph.nodes[new_node_4]["order"] == 2

    remove_nodes_from_project("PRJ-1234", [new_node_2])
    graph_post_delete = ProjectMetadata.get_project_by_id("PRJ-1234").project_graph
    nx_graph_post_delete: nx.DiGraph = nx.node_link_graph(graph_post_delete.value)

    assert nx_graph_post_delete.nodes[new_node_3]["order"] == 0
    assert nx_graph_post_delete.nodes[new_node_4]["order"] == 1


@pytest.mark.django_db
def test_graph_node_reorder():
    project_value = {
        "title": "Test Project",
        "projectId": "PRJ-1234",
        "users": [],
        "projectType": "experimental",
    }
    create_project_metdata(project_value)
    initialize_project_graph("PRJ-1234")

    new_node_1 = add_node_to_project(
        "PRJ-1234", "NODE_ROOT", "UUID1", constants.EXPERIMENT
    )
    new_node_2 = add_node_to_project(
        "PRJ-1234", new_node_1, "UUID2", constants.EXPERIMENT_MODEL_CONFIG
    )
    new_node_3 = add_node_to_project(
        "PRJ-1234", new_node_1, "UUID3", constants.EXPERIMENT_MODEL_CONFIG
    )
    new_node_4 = add_node_to_project(
        "PRJ-1234", new_node_1, "UUID4", constants.EXPERIMENT_MODEL_CONFIG
    )
    new_node_5 = add_node_to_project(
        "PRJ-1234", new_node_1, "UUID5", constants.EXPERIMENT_MODEL_CONFIG
    )

    graph = ProjectMetadata.get_project_by_id("PRJ-1234").project_graph
    nx_graph: nx.DiGraph = nx.node_link_graph(graph.value)

    assert nx_graph.nodes[new_node_2]["order"] == 0
    assert nx_graph.nodes[new_node_3]["order"] == 1
    assert nx_graph.nodes[new_node_4]["order"] == 2
    assert nx_graph.nodes[new_node_5]["order"] == 3

    reorder_project_nodes("PRJ-1234", new_node_2, 2)

    graph = ProjectMetadata.get_project_by_id("PRJ-1234").project_graph
    nx_graph: nx.DiGraph = nx.node_link_graph(graph.value)

    assert nx_graph.nodes[new_node_3]["order"] == 0
    assert nx_graph.nodes[new_node_4]["order"] == 1
    assert nx_graph.nodes[new_node_2]["order"] == 2
    assert nx_graph.nodes[new_node_5]["order"] == 3

    reorder_project_nodes("PRJ-1234", new_node_5, 0)

    graph = ProjectMetadata.get_project_by_id("PRJ-1234").project_graph
    nx_graph: nx.DiGraph = nx.node_link_graph(graph.value)

    assert nx_graph.nodes[new_node_5]["order"] == 0
    assert nx_graph.nodes[new_node_3]["order"] == 1
    assert nx_graph.nodes[new_node_4]["order"] == 2
    assert nx_graph.nodes[new_node_2]["order"] == 3

    # Test idempotency.
    reorder_project_nodes("PRJ-1234", new_node_5, 0)

    graph = ProjectMetadata.get_project_by_id("PRJ-1234").project_graph
    nx_graph: nx.DiGraph = nx.node_link_graph(graph.value)

    assert nx_graph.nodes[new_node_5]["order"] == 0
    assert nx_graph.nodes[new_node_3]["order"] == 1
    assert nx_graph.nodes[new_node_4]["order"] == 2
    assert nx_graph.nodes[new_node_2]["order"] == 3

    reorder_project_nodes("PRJ-1234", new_node_5, 3)

    graph = ProjectMetadata.get_project_by_id("PRJ-1234").project_graph
    nx_graph: nx.DiGraph = nx.node_link_graph(graph.value)

    assert nx_graph.nodes[new_node_3]["order"] == 0
    assert nx_graph.nodes[new_node_4]["order"] == 1
    assert nx_graph.nodes[new_node_2]["order"] == 2
    assert nx_graph.nodes[new_node_5]["order"] == 3


@pytest.mark.django_db
def test_add_file_associations():
    project_value = {
        "title": "Test Project",
        "projectId": "PRJ-1234",
        "users": [],
        "projectType": "experimental",
    }
    entity_value = {
        "title": "Test Entity",
        "description": "Entity with file associations",
    }
    create_project_metdata(project_value)

    entity_meta = create_entity_metadata(
        "PRJ-1234", name=constants.EXPERIMENT_EVENT, value=entity_value
    )

    file_objs = [
        FileObj(
            system="project.system", name="file1", path="/path/to/file1", type="file"
        ),
        FileObj(
            system="project.system", name="file2", path="/path/to/file2", type="file"
        ),
    ]

    assert len(entity_meta.value["fileObjs"]) == 0
    updated_entity = add_file_associations(entity_meta.uuid, file_objs)

    assert len(updated_entity.value["fileObjs"]) == 2

    more_file_objs = [
        FileObj(
            system="project.system", name="file2", path="/path/to/file2", type="file"
        ),
        FileObj(
            system="project.system", name="file3", path="/path/to/file3", type="file"
        ),
    ]
    updated_entity = add_file_associations(entity_meta.uuid, more_file_objs)

    assert len(updated_entity.value["fileObjs"]) == 3

    updated_entity = remove_file_associations(
        entity_meta.uuid, ["/path/to/file1", "/path/to/file2", "/path/to/file3"]
    )
    assert len(updated_entity.value["fileObjs"]) == 0


@pytest.mark.django_db
def test_add_file_tags():
    project_value = {
        "title": "Test Project",
        "projectId": "PRJ-1234",
        "users": [],
        "projectType": "experimental",
    }
    entity_value = {
        "title": "Test Entity",
        "description": "Entity with file associations",
    }
    create_project_metdata(project_value)

    entity_meta = create_entity_metadata(
        "PRJ-1234", name=constants.EXPERIMENT_EVENT, value=entity_value
    )

    file_tags = [
        FileTag(tag_name="tag1", path="/path/to/file1"),
        FileTag(tag_name="tag2", path="/path/to/file1"),
        FileTag(tag_name="tag1", path="/path/to/file2"),
    ]

    assert len(entity_meta.value["fileTags"]) == 0
    updated_entity = add_file_tags(entity_meta.uuid, file_tags)

    assert len(updated_entity.value["fileTags"]) == 3

    more_file_tags = [
        FileTag(tag_name="tag1", path="/path/to/file1"),
        FileTag(tag_name="tag2", path="/path/to/file1"),
        FileTag(tag_name="tag2", path="/path/to/file2"),
    ]
    updated_entity = add_file_tags(entity_meta.uuid, more_file_tags)

    assert len(updated_entity.value["fileTags"]) == 4

    updated_entity = remove_file_tags(entity_meta.uuid, (file_tags + more_file_tags))

    assert len(updated_entity.value["fileTags"]) == 0

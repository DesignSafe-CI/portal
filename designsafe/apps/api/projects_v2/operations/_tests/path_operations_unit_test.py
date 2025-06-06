"""Unit tests for the path_operations module"""

import pytest
import networkx as nx
from pathlib import Path
from designsafe.apps.api.projects_v2.operations._tests.path_operations_fixtures import (
    PUBLISHED_SIM_FIXTURE,
    PUBLISHED_OTHER_FIXTURE,
)
from designsafe.apps.api.projects_v2.operations.path_operations import (
    construct_entity_filepaths,
    construct_published_path_mappings,
    update_path_mappings,
)


def test_basepath_sim():
    pub_graph = nx.node_link_graph(PUBLISHED_SIM_FIXTURE)
    graph_with_basepaths = construct_entity_filepaths(pub_graph, dataset_root="/test")

    assert graph_with_basepaths.nodes["NODE_ROOT"]["basePath"] == "/test/PRJ-3462"
    assert (
        graph_with_basepaths.nodes["NODE_401565e2-2271-4b2c-b822-f89935a5a15f"][
            "basePath"
        ]
        == "/test/PRJ-3462/Simulation--parameter-influence-on-tropical-cyclone-rainfall/data/Model--tcr-model/Input--simulation-input/Output--simulation-of-parameter-influence-on-tropical-cyclone-rainfall"
    )


def test_fileobj_path_mapping_sim():
    pub_graph = nx.node_link_graph(PUBLISHED_SIM_FIXTURE)
    graph_with_basepaths = construct_entity_filepaths(pub_graph, dataset_root="/test")
    mappings = construct_published_path_mappings(graph_with_basepaths)
    assert (
        mappings["NODE_401565e2-2271-4b2c-b822-f89935a5a15f"][
            "/PRJ-3462/spatial_important_update.mat"
        ]
        == "/test/PRJ-3462/Simulation--parameter-influence-on-tropical-cyclone-rainfall/data/Model--tcr-model/Input--simulation-input/Output--simulation-of-parameter-influence-on-tropical-cyclone-rainfall/data/spatial_important_update.mat"
    )
    # Test that filename is deduplicated
    assert (
        mappings["NODE_401565e2-2271-4b2c-b822-f89935a5a15f"][
            "/PRJ-3462/mat-files/spatial_important_update.mat"
        ]
        == "/test/PRJ-3462/Simulation--parameter-influence-on-tropical-cyclone-rainfall/data/Model--tcr-model/Input--simulation-input/Output--simulation-of-parameter-influence-on-tropical-cyclone-rainfall/data/spatial_important_update(1).mat"
    )

    # Check that every file is mapped to a new path
    for node in pub_graph:
        for file_obj in pub_graph.nodes[node]["value"].get("fileObjs", []):
            assert mappings[node][file_obj["path"]] is not None


def test_path_mappings_added_to_graph_sim():
    pub_graph = nx.node_link_graph(PUBLISHED_SIM_FIXTURE)
    graph_with_basepaths = construct_entity_filepaths(pub_graph, dataset_root="/test")
    updated_graph, _ = update_path_mappings(graph_with_basepaths)

    # Assert that path mappings are applied to node metadata
    assert any(
        (
            fo
            for fo in updated_graph.nodes["NODE_401565e2-2271-4b2c-b822-f89935a5a15f"][
                "value"
            ]["fileObjs"]
            if fo["path"]
            == "/test/PRJ-3462/Simulation--parameter-influence-on-tropical-cyclone-rainfall/data/Model--tcr-model/Input--simulation-input/Output--simulation-of-parameter-influence-on-tropical-cyclone-rainfall/data/spatial_important_update.mat"
        )
    )
    assert any(
        (
            fo
            for fo in updated_graph.nodes["NODE_401565e2-2271-4b2c-b822-f89935a5a15f"][
                "value"
            ]["fileObjs"]
            if fo["path"]
            == "/test/PRJ-3462/Simulation--parameter-influence-on-tropical-cyclone-rainfall/data/Model--tcr-model/Input--simulation-input/Output--simulation-of-parameter-influence-on-tropical-cyclone-rainfall/data/spatial_important_update(1).mat"
        )
    )

    # Assert that file path mappings are reflected in file tags
    assert any(
        (
            tag
            for tag in updated_graph.nodes["NODE_401565e2-2271-4b2c-b822-f89935a5a15f"][
                "value"
            ]["fileTags"]
            if tag["tagName"] == "tropical cyclone"
            and tag["path"]
            == "/test/PRJ-3462/Simulation--parameter-influence-on-tropical-cyclone-rainfall/data/Model--tcr-model/Input--simulation-input/Output--simulation-of-parameter-influence-on-tropical-cyclone-rainfall/data/spatial_important_update.mat"
        )
    )
    assert any(
        (
            tag
            for tag in updated_graph.nodes["NODE_401565e2-2271-4b2c-b822-f89935a5a15f"][
                "value"
            ]["fileTags"]
            if tag["tagName"] == "tropical cyclone (duplicate filename)"
            and tag["path"]
            == "/test/PRJ-3462/Simulation--parameter-influence-on-tropical-cyclone-rainfall/data/Model--tcr-model/Input--simulation-input/Output--simulation-of-parameter-influence-on-tropical-cyclone-rainfall/data/spatial_important_update(1).mat"
        )
    )


def test_base_paths_other_version():
    pub_graph = nx.node_link_graph(PUBLISHED_OTHER_FIXTURE)
    graph_with_basepaths = construct_entity_filepaths(
        pub_graph, dataset_root="/test", strip_legacy_versions=True
    )
    updated_graph, _ = update_path_mappings(
        graph_with_basepaths, legacy_other_pubs=True
    )
    prj_title_slug = "Project--should-severe-weather-graphics-wear-a-uniform-implications-of-inconsistent-visual-displays-on-end-user-uncertainty-risk-perception-and-behavioral-intentions"
    assert (
        updated_graph.nodes["NODE_d1a7e2e6-692f-4c24-b836-ce0c7abfe8b2"]["basePath"]
        == f"/test/PRJ-3816/{prj_title_slug}"
    )
    assert (
        updated_graph.nodes["NODE_5dc39e3f-033d-437e-8254-c65de12c2d76"]["basePath"]
        == f"/test/PRJ-3816/{prj_title_slug}--V2"
    )
    assert (
        updated_graph.nodes["NODE_0f8105ce-5900-4747-bfa6-5f1bab78f3ee"]["basePath"]
        == f"/test/PRJ-3816/{prj_title_slug}--V3"
    )

    v3_data_path = f"/test/PRJ-3816/{prj_title_slug}--V3/data"
    v3_fileTags = updated_graph.nodes["NODE_0f8105ce-5900-4747-bfa6-5f1bab78f3ee"][
        "value"
    ]["fileTags"]
    v3_legacy_tags = pub_graph.nodes["NODE_0f8105ce-5900-4747-bfa6-5f1bab78f3ee"][
        "value"
    ]["fileTags"]

    # Each tag should start with the computed base path and end with the filename from the original tag.
    for i, tag in enumerate(v3_fileTags):
        assert tag["path"].startswith(v3_data_path)
        tag_filename = Path(v3_legacy_tags[i]["path"]).name
        assert tag["path"].endswith(tag_filename)

"""Utils for constructing Fedora metadata definitions from publications"""

import urllib
import networkx as nx

from designsafe.apps.api.publications_v2.models import Publication
from designsafe.apps.api.projects_v2.schema_models import SCHEMA_MAPPING, PATH_SLUGS
from designsafe.apps.api.projects_v2.schema_models.base import BaseProject
from designsafe.apps.api.projects_v2 import constants

prov_predecessor_mapping = {
    # Experimental
    constants.EXPERIMENT: {"wasStartedBy": [constants.PROJECT]},
    constants.EXPERIMENT_MODEL_CONFIG: {"wasGeneratedBy": [constants.EXPERIMENT]},
    constants.EXPERIMENT_SENSOR: {
        "wasGeneratedBy": [constants.EXPERIMENT],
        "wasDerivedFrom": [constants.EXPERIMENT_MODEL_CONFIG],
    },
    constants.EXPERIMENT_EVENT: {
        "wasGeneratedBy": [constants.EXPERIMENT],
        "wasDerivedFrom": [constants.EXPERIMENT_MODEL_CONFIG],
        "wasInformedBy": [constants.EXPERIMENT_SENSOR],
    },
    constants.EXPERIMENT_REPORT: {
        "wasGeneratedBy": [constants.EXPERIMENT],
    },
    constants.EXPERIMENT_ANALYSIS: {
        "wasGeneratedBy": [constants.EXPERIMENT],
    },
    # Hybrid Sim
    constants.HYBRID_SIM: {"wasGeneratedBy": [constants.PROJECT]},
    constants.HYBRID_SIM_GLOBAL_MODEL: {"wasGeneratedBy": [constants.HYBRID_SIM]},
    constants.HYBRID_SIM_COORDINATOR: {
        "wasGeneratedBy": [constants.HYBRID_SIM],
        "wasInfluencedBy": [constants.HYBRID_SIM_GLOBAL_MODEL],
    },
    constants.HYBRID_SIM_COORDINATOR_OUTPUT: {
        "wasGeneratedBy": [constants.HYBRID_SIM],
        "wasInfluencedBy": [constants.HYBRID_SIM_GLOBAL_MODEL],
        "wasDerivedFrom": [constants.HYBRID_SIM_COORDINATOR],
    },
    constants.HYBRID_SIM_SIM_SUBSTRUCTURE: {
        "wasInfluencedBy": [
            constants.HYBRID_SIM_GLOBAL_MODEL,
            constants.HYBRID_SIM_COORDINATOR,
        ],
        "wasGeneratedBy": [constants.HYBRID_SIM],
    },
    constants.HYBRID_SIM_SIM_OUTPUT: {
        "wasDerivedFrom": [constants.HYBRID_SIM_SIM_SUBSTRUCTURE]
    },
    constants.HYBRID_SIM_EXP_SUBSTRUCTURE: {
        "wasInfluencedBy": [
            constants.HYBRID_SIM_GLOBAL_MODEL,
            constants.HYBRID_SIM_COORDINATOR,
        ],
        "wasGeneratedBy": [constants.HYBRID_SIM],
    },
    constants.HYBRID_SIM_EXP_OUTPUT: {
        "wasDerivedFrom": [constants.HYBRID_SIM_EXP_SUBSTRUCTURE]
    },
    constants.HYBRID_SIM_ANALYSIS: {"wasGeneratedBy": [constants.HYBRID_SIM]},
    constants.HYBRID_SIM_REPORT: {"wasGenerateBy": [constants.HYBRID_SIM]},
    # Simulation
    constants.SIMULATION: {"wasGeneratedBy": [constants.PROJECT]},
    constants.SIMULATION_MODEL: {"wasGeneratedBy": [constants.SIMULATION]},
    constants.SIMULATION_INPUT: {
        "wasGeneratedBy": [constants.SIMULATION],
        "wasDerivedFrom": [constants.SIMULATION_MODEL],
    },
    constants.SIMULATION_OUTPUT: {
        "wasGeneratedBy": [constants.SIMULATION],
        "wasDerivedFrom": [constants.SIMULATION_MODEL, constants.SIMULATION_INPUT],
    },
    constants.SIMULATION_ANALYSIS: {"wasGeneratedBy": [constants.SIMULATION]},
    constants.SIMULATION_REPORT: {"wasGeneratedBy": [constants.SIMULATION]},
    # Field Recon
    constants.FIELD_RECON_MISSION: {"wasStartedBy": [constants.PROJECT]},
    constants.FIELD_RECON_REPORT: {"wasStartedBy": [constants.PROJECT]},
    constants.FIELD_RECON_PLANNING: {"wasGeneratedBy": [constants.FIELD_RECON_MISSION]},
    constants.FIELD_RECON_SOCIAL_SCIENCE: {
        "wasGeneratedBy": [constants.FIELD_RECON_MISSION]
    },
    constants.FIELD_RECON_GEOSCIENCE: {
        "wasGeneratedBy": [constants.FIELD_RECON_MISSION]
    },
}

prov_successor_mapping = {
    constants.EXPERIMENT: {
        "generated": [
            constants.EXPERIMENT_MODEL_CONFIG,
            constants.EXPERIMENT_ANALYSIS,
            constants.EXPERIMENT_REPORT,
            constants.EXPERIMENT_SENSOR,
            constants.EXPERIMENT_EVENT,
        ]
    },
    constants.HYBRID_SIM: {
        "generated": [
            constants.HYBRID_SIM_ANALYSIS,
            constants.HYBRID_SIM_REPORT,
            constants.HYBRID_SIM_COORDINATOR,
            constants.HYBRID_SIM_GLOBAL_MODEL,
            constants.HYBRID_SIM_COORDINATOR_OUTPUT,
            constants.HYBRID_SIM_SIM_SUBSTRUCTURE,
            constants.HYBRID_SIM_SIM_OUTPUT,
            constants.HYBRID_SIM_EXP_SUBSTRUCTURE,
            constants.HYBRID_SIM_EXP_OUTPUT,
        ]
    },
    constants.SIMULATION: {
        "generated": [
            constants.SIMULATION_ANALYSIS,
            constants.SIMULATION_REPORT,
            constants.SIMULATION_MODEL,
            constants.SIMULATION_INPUT,
            constants.SIMULATION_OUTPUT,
        ]
    },
    constants.FIELD_RECON_MISSION: {
        "generated": [
            constants.FIELD_RECON_PLANNING,
            constants.FIELD_RECON_SOCIAL_SCIENCE,
            constants.FIELD_RECON_GEOSCIENCE,
        ]
    },
}


def get_node_url_path(
    pub_tree: nx.DiGraph, node_id: str, project_id: str, version: str = 1
):
    """Get the path to an entity in Fedora relative to the publication container root."""
    url_path = project_id
    if version > 1:
        url_path = f"{project_id}v{version}"

    node_path = nx.shortest_path(pub_tree, source="NODE_ROOT", target=node_id)
    for path_id in node_path[1:]:
        entity_title = pub_tree.nodes[path_id]["value"]["title"]
        url_path += f"/{urllib.parse.quote(entity_title)}"

    return url_path


def get_predecessor_prov_tags(pub_tree: nx.DiGraph, node_id: str):
    """
    Get PROV metadata relating to a node's predecessors. Example return value:
    {'wasGeneratedBy': ['Experiment: Particle Image Data (10.17603/ds2-j0b5-5y02)'],
     'wasDerivedFrom': ['Model-config: Culebra, Humacao and Yabucoa'],
     'wasInformedBy': ['Sensor: Particle Image Velocimetry System']}
    """
    prov_predecessor_json = {}
    node_name = pub_tree.nodes[node_id]["name"]

    node_path = nx.shortest_path(pub_tree, source="NODE_ROOT", target=node_id)
    prov_map = prov_predecessor_mapping.get(node_name, {})
    for predecessor_node_id in node_path:
        for prov_relation in prov_map:
            if pub_tree.nodes[predecessor_node_id]["name"] in prov_map[prov_relation]:
                predecessor_node_data = pub_tree.nodes[predecessor_node_id]
                predecessor_name = f"{PATH_SLUGS[predecessor_node_data['name']]}: {predecessor_node_data['value']['title']}"
                if predecessor_node_data["value"].get("dois"):
                    predecessor_name += (
                        f" ({predecessor_node_data['value']['dois'][0]})"
                    )

                prov_predecessor_json[prov_relation] = prov_predecessor_json.get(
                    prov_relation, []
                ) + [predecessor_name]

    return prov_predecessor_json


def get_successor_prov_tags(pub_tree: nx.DiGraph, node_id: str):
    """
    Get PROV metadata related to a nodes' successors. Example return value:
    {'generated': ['Report: Data Dictionary',
                   'Model-config: Culebra, Humacao and Yabucoa',
                   'Sensor: Particle Image Velocimetry System',
                   'Event: Approach Flow',
                   'Event: Culebra Model']}
    """
    prov_successor_json = {}
    node_name = pub_tree.nodes[node_id]["name"]
    prov_map = prov_successor_mapping.get(node_name, {})

    successors = nx.dfs_preorder_nodes(pub_tree, node_id)
    for successor_node_id in successors:
        for prov_relation in prov_map:
            if pub_tree.nodes[successor_node_id]["name"] in prov_map[prov_relation]:

                successor_node_data = pub_tree.nodes[successor_node_id]
                successor_name = f"{PATH_SLUGS[successor_node_data['name']]}: {successor_node_data['value']['title']}"
                if successor_node_data["value"].get("dois"):
                    successor_name += f" ({successor_node_data['value']['dois'][0]})"

                prov_successor_json[prov_relation] = prov_successor_json.get(
                    prov_relation, []
                ) + [successor_name]

    return prov_successor_json


def get_project_root_mapping(
    project_id, version, pub_tree: nx.DiGraph, node_data: dict
):
    """Get Fedora mapping for the project root."""

    fedora_json = BaseProject.model_validate(node_data["value"]).to_fedora_json()

    publication_date = node_data.get("publicationDate", None)
    if publication_date:
        fedora_json["available"] = publication_date

    project_mapping = {
        "uuid": node_data["uuid"],
        "container_path": get_node_url_path(pub_tree, "NODE_ROOT", project_id, version),
        "fedora_mapping": fedora_json,
        "fileObjs": [],
        "fileTags": node_data["value"].get("fileTags", []),
    }
    return project_mapping


def get_fedora_json(project_id: str, version: int = 1):
    """
    Returns Fedora mappings and path/file tag information for each entity in a pub.
    """
    pub = Publication.objects.get(project_id=project_id)

    pub_tree: nx.DiGraph = nx.node_link_graph(pub.tree)

    pub_root = pub_tree.nodes["NODE_ROOT"]

    fedora_json_mappings = []

    # Handle type Other
    if not pub_root.get("name"):
        base_project_node_data = next(
            (
                pub_tree.nodes[e]
                for e in pub_tree.successors("NODE_ROOT")
                if pub_tree.nodes[e]["version"] == version
            ),
            None,
        )
        project_mapping = get_project_root_mapping(
            project_id, version, pub_tree, base_project_node_data
        )

        fedora_json_mappings.append(project_mapping)
        return fedora_json_mappings

    # Handle non-Other pubs with entity trees

    base_project_mapping = get_project_root_mapping(
        project_id, version, pub_tree, pub_tree.nodes["NODE_ROOT"]
    )

    fedora_json_mappings.append(base_project_mapping)

    published_entities_with_version = [
        e
        for e in pub_tree.successors("NODE_ROOT")
        if pub_tree.nodes[e]["version"] == version
    ]

    for entity_node in published_entities_with_version:
        dfs_nodes = nx.dfs_preorder_nodes(pub_tree, entity_node)
        for dfs_node_id in dfs_nodes:
            entity_meta = pub_tree.nodes[dfs_node_id]

            fedora_mapping = (
                SCHEMA_MAPPING[entity_meta["name"]]
                .model_validate(entity_meta["value"])
                .to_fedora_json()
            )
            fedora_mapping = {
                **fedora_mapping,
                **get_predecessor_prov_tags(pub_tree, dfs_node_id),
                **get_successor_prov_tags(pub_tree, dfs_node_id),
            }

            if not fedora_mapping.get("identifier"):
                fedora_mapping["identifier"] = entity_meta["uuid"]

            fedora_json_mappings.append(
                {
                    "uuid": entity_meta["uuid"],
                    "container_path": get_node_url_path(
                        pub_tree, dfs_node_id, project_id, version
                    ),
                    "fedora_mapping": fedora_mapping,
                    "fileObjs": entity_meta["value"].get("fileObjs", []),
                    "fileTags": entity_meta["value"].get("fileTags", []),
                }
            )
    return fedora_json_mappings

import json
import networkx as nx
from uuid import uuid4
from collections import deque
from typing import List, Dict

# map metadata 'name' field to hierarchy level
EXPT_PROJECT_HIERARCHY = {
    'designsafe.project': 0,
    'designsafe.project.experiment': 1,
    'designsafe.project.analysis': 2,
    'designsafe.project.report': 2,
    'designsafe.project.model_config': 2,
    'designsafe.project.sensor_list': 3,
    'designsafe.project.event': 4
}


def get_project_root():
    with open('designsafe/apps/projects/fixtures/expt_base.json') as f:
        return json.load(f)


def get_project_entities():
    with open('designsafe/apps/projects/fixtures/expt_all.json') as f:
        return json.load(f)


def get_entity_by_uuid(entity_list, uuid):
    return next(ent for ent in entity_list if ent['uuid'] == uuid)


def get_direct_parents(entity_list, entity) -> List[str]:
    """
    Returns a list of UUIDs of the direct parents of an entity. Entity A is
    considered a direct child of entity B if B is in A's list of association
    IDs and the entity types are exactly 1 step apart in the hierarchy.
    """
    return [assoc_entity['uuid'] for assoc_entity in entity_list
                    if assoc_entity['uuid'] in entity['associationIds']
                    and EXPT_PROJECT_HIERARCHY[entity['name']] ==
                    1 + EXPT_PROJECT_HIERARCHY[assoc_entity['name']]
    ]


def get_edges() -> Dict[str, List[str]]:
    """
    In legacy project metadata an entity's associationIds value contains the
    UUIDs of any entity above it in the hierarchy. This method reverses the
    association and returns a dictionary that maps entity UUIDs to the UUIDs
    of their direct children.
    """
    edges = {}
    project_entities = [get_project_root()] + get_project_entities()
    for entity in project_entities:
        for parent_uuid in get_direct_parents(project_entities, entity):
            edges[parent_uuid] = edges.get(parent_uuid, []) + [entity['uuid']]
    return edges


def construct_graph() -> nx.DiGraph:
    """
    Constructs a NetworkX graph representing the project structure. Each node
    has a generated ID separate from the entity UUID (since an entity can
    appear more than once in the graph). The project root has ID 'root'. Node
    data contains the entity UUID and the UI display order.
    """
    root = get_project_root()
    edge_list = get_edges()
    G = nx.DiGraph()

    # initialize DFS stack with root UUID, no parent, and order 0
    stack = deque([(root['uuid'], None, 0)])
    while len(stack):
        uuid, parent_id, order = stack.pop()
        node_id = str(uuid4()) if parent_id else 'root'
        G.add_node(node_id, uuid=uuid, order=order)

        if parent_id:
            G.add_edge(parent_id, node_id)

        for idx, child_uuid in enumerate(edge_list.get(uuid, [])):
            stack.append((child_uuid, node_id, idx))

    return G

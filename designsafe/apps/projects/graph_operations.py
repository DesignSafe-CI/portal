import json
import networkx as nx
from uuid import uuid4
from collections import deque
from typing import List, Dict

# map metadata 'name' field to allowed (direct) children
ALLOWED_RELATIONS = {
    'designsafe.project': ['designsafe.project.experiment',
                           'designsafe.project.simulation',
                           'designsafe.project.hybrid_simulation',
                           'designsafe.project.field_recon.mission',
                           'designsafe.project.field_recon.report'],

    # Experimental
    'designsafe.project.experiment': ['designsafe.project.analysis',
                                      'designsafe.project.report',
                                      'designsafe.project.model_config'],
    'designsafe.project.model_config': ['designsafe.project.sensor_list'],
    'designsafe.project.sensor_list': ['designsafe.project.event'],

    # Simulation
    'designsafe.project.simulation': [
        'designsafe.project.simulation.analysis',
        'designsafe.project.simulation.report',
        'designsafe.project.simulation.model'],
    'designsafe.project.simulation.model': [
        'designsafe.project.simulation.input'],
    'designsafe.project.simulation.input': [
        'designsafe.project.simulation.output'],

    # Hybrid sim
    'designsafe.project.hybrid_simulation': [
        'designsafe.project.hybrid_simulation.report',
        'designsafe.project.hybrid_simulation.global_model',
        'designsafe.project.hybrid_simulation.analysis'],
    'designsafe.project.hybrid_simulation.global_model': [
        'designsafe.project.hybrid_simulation.coordinator'],
    'designsafe.project.hybrid_simulation.coordinator': [
        'designsafe.project.hybrid_simulation.coordinator_output',
        'designsafe.project.hybrid_simulation.sim_substructure',
        'designsafe.project.hybrid_simulation.exp_substructure'],
    'designsafe.project.hybrid_simulation.sim_substructure': [
        'designsafe.project.hybrid_simulation.sim_output'],
    'designsafe.project.hybrid_simulation.exp_substructure': [
        'designsafe.project.hybrid_simulation.exp_output'],

    # Field Recon
    'designsafe.project.field_recon.mission': [
        'designsafe.project.field_recon.planning',
        'designsafe.project.field_recon.social_science',
        'designsafe.project.field_recon.geoscience']
}


def get_project_root():
    with open('designsafe/apps/projects/fixtures/fr_root.json') as f:
        return json.load(f)


def get_project_entities():
    with open('designsafe/apps/projects/fixtures/fr_all.json') as f:
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
            and entity['name'] in ALLOWED_RELATIONS[assoc_entity['name']]
            ]


def get_order(entity, parent_uuid) -> int:
    try:
        return next(order['value'] for order in entity['_ui']['orders'] \
            if order['parent'] == parent_uuid)
    except (StopIteration, KeyError):
        return None


def get_edges(project_entities) -> Dict[str, List[str]]:
    """
    In legacy project metadata an entity's associationIds value contains the
    UUIDs of any entity above it in the hierarchy. This method reverses the
    association and returns a dictionary that maps entity UUIDs to the UUIDs
    of their direct children.
    """
    edges = {}
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
    project_entities = [root] + get_project_entities()
    edge_list = get_edges(project_entities)
    G = nx.DiGraph()

    # initialize DFS stack with root UUID, no parent, and order 0
    stack = deque([(root['uuid'], None, 0)])
    while len(stack):
        uuid, parent_id, order = stack.pop()
        entity = get_entity_by_uuid(project_entities, uuid)
        ui_order = get_order(entity, uuid)
        if ui_order is not None:
            order = ui_order

        node_id = str(uuid4()) if parent_id else 'root'
        G.add_node(node_id, uuid=uuid, order=order, name=entity['name'])

        if parent_id:
            G.add_edge(parent_id, node_id)

        for idx, child_uuid in enumerate(edge_list.get(uuid, [])):
            stack.append((child_uuid, node_id, idx))

    return G

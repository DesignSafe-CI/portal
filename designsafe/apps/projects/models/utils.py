"""Utilities for projects models"""
import logging
from designsafe.apps.projects.models.agave import base
from designsafe.apps.projects.models.agave import experimental
from designsafe.apps.projects.models.agave import simulation
from designsafe.apps.projects.models.agave import hybrid_simulation
from designsafe.apps.projects.models.agave import rapid
from designsafe.apps.projects.models.agave.base import Project

logger = logging.getLogger(__name__)

def lookup_model(entity=None, name=None):
    if entity is not None:
        entity_name = entity['name']
    elif name is not None:
        entity_name = name

    entity_meta_name = entity_name.replace("designsafe.project.", "")
    comps = entity_meta_name.split('.')
    project_type = 'experimental'
    if len(comps) == 2:
        project_type, ename = comps
    elif entity_meta_name in ["simulation", "hybrid_simulation", "field_recon"]:
        project_type = ename = entity_meta_name
    else:
        ename = entity_meta_name

    if entity_name == 'designsafe.project':
        if isinstance(entity, dict):
            ename = '{ptype}_project'.format(ptype=entity['value'].get('projectType', ''))
        else:
            ename = '{ptype}_project'.format(ptype=entity.value.project_type)

        modules = [base, experimental, simulation, hybrid_simulation, rapid]
    else:
        switch = {'experimental': [experimental], 'simulation': [simulation],
                  'hybrid_simulation': [hybrid_simulation], 'field_recon': [rapid]}
        modules = switch[project_type]

    name_comps = ename.split('_')
    name = ''
    for comp in name_comps:
        if not comp:
            continue
        name += comp[0].upper() + comp[1:]
    cls = None
    for module in modules:
        try:
            cls = getattr(module, name)
            break
        except AttributeError:
            pass
    if cls is None and ename.endswith('_project'):
        return Project
    elif cls is None:
        raise AttributeError("Model '{model}' needed for '{name}' does not exist".format(model=name, name=ename))

    return cls

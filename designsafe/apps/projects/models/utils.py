"""Utilities for projects models"""
import logging
from designsafe.apps.projects.models.agave import experimental
from designsafe.apps.projects.models.agave import simulation
from designsafe.apps.projects.models.agave import hybrid_simulation
from designsafe.apps.projects.models.agave import rapid
from designsafe.apps.projects.models.agave.base import Project

logger = logging.getLogger(__name__)

def lookup_model(entity):
    entity_name = entity['name'].replace("designsafe.project.", "")
    comps = entity_name.split('.')
    #ename = entity['name'].rsplit('.', 1)[1].lower()
    project_type = 'experimental'
    if len(comps) == 2:
        project_type, ename = comps
    elif entity_name in ["simulation", "hybrid_simulation"]:
        project_type = ename = entity_name
    else:
        ename = entity['name'].rsplit('.', 1)[1].lower()

    if entity['name'] == 'designsafe.project':
        ename = '{ptype}_project'.format(ptype=entity['value']['projectType'])
        modules = [experimental, simulation, hybrid_simulation, rapid]
    else:
        switch = {'experimental': [experimental], 'simulation': [simulation],
                  'hybrid_simulation': [hybrid_simulation], 'rapid': [rapid]}
        modules = switch[project_type]

    name_comps = ename.split('_')
    name = ''
    for comp in name_comps:
        name += comp[0].upper() + comp[1:]
    #logger.debug('name: %s', name)
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
        raise AttributeError("Model '{model}' needed for '{name}' does not exists".format(model=name, name=ename))

    return cls

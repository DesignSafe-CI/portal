"""Utilities for projects models"""
import logging
from designsafe.apps.projects.models.agave import experimental
from designsafe.apps.projects.models.agave import simulation
from designsafe.apps.projects.models.agave import hybrid_simulation
from designsafe.apps.projects.models.agave import rapid
from designsafe.apps.projects.models.agave.base import Project

logger = logging.getLogger(__name__)

def lookup_model(entity):
    ename = entity['name'].rsplit('.', 1)[1].lower()

    if ename == 'project':
        ename = '{ptype}_project'.format(ptype=entity['value']['projectType'])

    name_comps = ename.split('_')
    name = ''
    for comp in name_comps:
        name += comp[0].upper() + comp[1:]
    logger.debug('name: %s', name)
    cls = None
    for module in [experimental, simulation, hybrid_simulation, rapid]:
        try:
            cls = getattr(module, name)
            logger.debug('cls: %s', cls)
            break
        except AttributeError:
            pass
    if cls is None and ename.endswith('_project'):
        return Project
    elif cls is None:
        raise AttributeError

    return cls

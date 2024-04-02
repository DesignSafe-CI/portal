"""Utilities for projects models."""

import logging
from designsafe.apps.projects.models.agave import base
from designsafe.apps.projects.models.agave import experimental
from designsafe.apps.projects.models.agave import simulation
from designsafe.apps.projects.models.agave import hybrid_simulation
from designsafe.apps.projects.models.agave import rapid
from designsafe.apps.projects.models.agave.base import Project

logger = logging.getLogger(__name__)


def lookup_model(entity=None, name=None):
    """Lookup project or entity model.

    Lookup the correct class based on a json object or a name.
    In this case `name` is an Agave metadata name, e.g. `designsafe.project.experiment`.

    .. rubric:: Algorithm
        1. Get entity name from json object or :param:`name` string.
        2. Remove `designsafe.project` from the `name` since it's a commonality.
        3. Get project type from the resulting `name` since `name`'s are in the form of
            `designsafe.project.<project_type>.<entity_name>`.
        4. Get the python modules where we'll search the model class.
        4.1 If `name` is `"designsafe.project"` we are looking at a project and we create
            a string of the form `<project_type>_project` and add every project model class
            to our search list.
        4.2 Else, add the python modules specific to the project type to the search list.
        5. Transform the entity name from spinal case to reverse camel case. e.g.
            from `"simulation_project"` to `"SimulationProject"`. or
            from `"model_config"` to `"ModelConfig"`.
        6. Loop through the search list and try to load the class using the transformed
            string in step 5.
        7. If nothing was found then return :class:`Project`.
        8. Else, return the corresponding class.

    .. examples::
        Initialize a project instance based on a json obj.
        >>> project_meta = agave_client.meta.listMetadata(uuid='prj_uuid')
        >>> project_cls = lookup_model(project_meta)
        >>> project = project_cls(**project_meta)

        Create a new entity.
        >>> entity_json = {"value": {"title": "This is a Simulation."}}
        >>> entity_cls = lookup_model(name="designsafe.project.simulation")
        >>> simulation = entity_cls(**entity_json)

    :param dict entity: Entity to analyze.
    :param str name: Name to analyze.
    """
    if entity is not None:
        entity_name = entity["name"]
    elif name is not None:
        entity_name = name

    entity_meta_name = entity_name.replace("designsafe.project.", "")
    comps = entity_meta_name.split(".")
    project_type = "experimental"
    if len(comps) == 2:
        project_type, ename = comps
    elif entity_meta_name in ["simulation", "hybrid_simulation", "field_recon"]:
        project_type = ename = entity_meta_name
    else:
        ename = entity_meta_name

    if entity_name == "designsafe.project":
        if isinstance(entity, dict):
            ename = "{ptype}_project".format(
                ptype=entity["value"].get("projectType", "")
            )
        else:
            ename = "{ptype}_project".format(ptype=entity.value.project_type)

        modules = [base, experimental, simulation, hybrid_simulation, rapid]
    else:
        switch = {
            "experimental": [experimental],
            "simulation": [simulation],
            "hybrid_simulation": [hybrid_simulation],
            "field_recon": [rapid],
        }
        modules = switch[project_type]

    name_comps = ename.split("_")
    name = ""
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
    if cls is None and ename.endswith("_project"):
        return Project
    elif cls is None:
        raise AttributeError(
            "Model '{model}' needed for '{name}' does not exist".format(
                model=name, name=ename
            )
        )

    return cls

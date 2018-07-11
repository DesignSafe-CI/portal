"""Hybrid Simulation project models"""
import logging
import six
from designsafe.apps.data.models.agave.base import Model as MetadataModel
from designsafe.apps.data.models.agave import fields
from designsafe.apps.projects.models.agave.base import RelatedEntity, Project

logger = logging.getLogger(__name__)


class HybridSimulationProject(Project):
    model_name = 'designsafe.project'
    team_members = fields.ListField('Team Members')
    co_pis = fields.ListField('Co PIs')
    project_type = fields.CharField(
        'Project Type',
        max_length=255,
        default='hybrid simulation'
    )
    project_id = fields.CharField('Project Id')
    description = fields.CharField(
        'Description',
        max_length=1024,
        default=''
    )
    title = fields.CharField('Title', max_length=255, default='')
    pi = fields.CharField('PI', max_length=255)
    award_number = fields.CharField('Award Number', max_length=255)
    associated_projects = fields.ListField('Associated Project')
    ef = fields.CharField('Experimental Facility', max_length=512)
    keywords = fields.CharField('Keywords')

class FileModel(MetadataModel):
    model_name = 'designsafe.file'
    keywords = fields.ListField('Keywords')
    project_UUID = fields.RelatedObjectField(HybridSimulationProject, default=[])

class DataTag(MetadataModel):
    _is_nested = True
    file = fields.RelatedObjectField(FileModel, default=[])
    desc = fields.CharField('Description', max_length=512, default='')


class HybridSimulation(RelatedEntity):
    model_name = 'designsafe.project.hybrid_simulation'
    title = fields.CharField('Title', max_length=1024)
    simulation_type = fields.CharField('Simulation Type', max_length=1024)
    simulation_type_other = fields.CharField(
        'Simulation Type Other',
        max_length=1024
    )
    description = fields.CharField(
        'Description',
        max_length=1024,
        default=''
    )
    authors = fields.ListField('Authors')
    project = fields.RelatedObjectField(HybridSimulationProject)


class GlobalModel(RelatedEntity):
    model_name = 'designsafe.project.hybrid_simulation.global_model'
    title = fields.CharField('Title', max_length=1024)
    description = fields.CharField(
        'Description',
        max_length=1024,
        default=''
    )
    project = fields.RelatedObjectField(HybridSimulationProject)
    hybrid_simulations = fields.RelatedObjectField(HybridSimulation)
    files = fields.RelatedObjectField(FileModel, multiple=True)

class Coordinator(RelatedEntity):
    model_name = 'designsafe.project.hybrid_simulation.coordinator'
    title = fields.CharField('Title', max_length=512)
    project = fields.RelatedObjectField(HybridSimulationProject)
    description = fields.CharField('Description', max_length=1024, default='')
    application_version = fields.CharField(
        'Application & Version',
        max_length=1024,
        default=''
    )
    hybrid_simulations = fields.RelatedObjectField(HybridSimulation)
    global_models = fields.RelatedObjectField(GlobalModel)
    files = fields.RelatedObjectField(FileModel, multiple=True)

class SimSubstructure(RelatedEntity):
    model_name = 'designsafe.project.hybrid_simulation.sim_substructure'
    title = fields.CharField('Title', max_length=512)
    description = fields.CharField('Description', max_length=1024, default='')
    application_version = fields.CharField(
        'Application & Version',
        max_length=1024,
        default=''
    )
    project = fields.RelatedObjectField(HybridSimulationProject)
    hybrid_simulations = fields.RelatedObjectField(HybridSimulation)
    global_models = fields.RelatedObjectField(GlobalModel)
    coordinators = fields.RelatedObjectField(Coordinator)
    files = fields.RelatedObjectField(FileModel, multiple=True)

class ExpSubstructure(RelatedEntity):
    model_name = 'designsafe.project.hybrid_simulation.exp_substructure'
    title = fields.CharField('Title', max_length=512)
    description = fields.CharField('Description', max_length=1024, default='')
    project = fields.RelatedObjectField(HybridSimulationProject)
    hybrid_simulations = fields.RelatedObjectField(HybridSimulation)
    global_models = fields.RelatedObjectField(GlobalModel)
    coordinators = fields.RelatedObjectField(Coordinator)
    files = fields.RelatedObjectField(FileModel, multiple=True)

# class Output(RelatedEntity):
#    model_name = 'designsafe.project.hybrid_simulation.output'
#    title = fields.CharField('Title', max_length=512)
#    description = fields.CharField('Description', max_length=1024, default='')
#    project = fields.RelatedObjectField(HybridSimulationProject)
#    hybrid_simulations = fields.RelatedObjectField(HybridSimulation)
#    global_models = fields.RelatedObjectField(GlobalModel)
#    coordinators = fields.RelatedObjectField(Coordinator)
#    exp_substructures = fields.RelatedObjectField(ExpSubstructure)
#    sim_substructures = fields.RelatedObjectField(SimSubstructure)
#    files = fields.RelatedObjectField(FileModel, multiple=True)

class CoordinatorOutput(RelatedEntity):
    model_name = 'designsafe.project.hybrid_simulation.coordinator_output'
    title = fields.CharField('Title', max_length=512)
    description = fields.CharField('Description', max_length=1024, default='')
    project = fields.RelatedObjectField(HybridSimulationProject)
    hybrid_simulations = fields.RelatedObjectField(HybridSimulation)
    global_models = fields.RelatedObjectField(GlobalModel)
    coordinators = fields.RelatedObjectField(Coordinator)
    files = fields.RelatedObjectField(FileModel, multiple=True)

class SimOutput(RelatedEntity):
    model_name = 'designsafe.project.hybrid_simulation.sim_output'
    title = fields.CharField('Title', max_length=512)
    description = fields.CharField('Description', max_length=1024, default='')
    project = fields.RelatedObjectField(HybridSimulationProject)
    hybrid_simulations = fields.RelatedObjectField(HybridSimulation)
    coordinators = fields.RelatedObjectField(Coordinator)
    sim_substructures = fields.RelatedObjectField(SimSubstructure)
    files = fields.RelatedObjectField(FileModel, multiple=True)

class ExpOutput(RelatedEntity):
    model_name = 'designsafe.project.hybrid_simulation.exp_output'
    title = fields.CharField('Title', max_length=512)
    description = fields.CharField('Description', max_length=1024, default='')
    project = fields.RelatedObjectField(HybridSimulationProject)
    hybrid_simulations = fields.RelatedObjectField(HybridSimulation)
    coordinators = fields.RelatedObjectField(Coordinator)
    exp_substructures = fields.RelatedObjectField(ExpSubstructure)
    files = fields.RelatedObjectField(FileModel, multiple=True)

class Analysis(RelatedEntity):
    model_name = 'designsafe.project.hybrid_simulation.analysis'
    title = fields.CharField('Title', max_length=1024)
    description = fields.CharField('Description', max_length=1024, default='')
    reference = fields.CharField('Reference Data', max_length=1024)
    referencedoi = fields.CharField('Reference DOI', max_length=1024)
    project = fields.RelatedObjectField(HybridSimulationProject)
    hybrid_simulations = fields.RelatedObjectField(HybridSimulation)
    files = fields.RelatedObjectField(FileModel, multiple=True)

class Report(RelatedEntity):
    model_name = 'designsafe.project.hybrid_simulation.report'
    title = fields.CharField('Title', max_length=1024)
    description = fields.CharField('Description', max_length=1024, default='')
    project = fields.RelatedObjectField(HybridSimulationProject)
    hybrid_simulations = fields.RelatedObjectField(HybridSimulation)
    files = fields.RelatedObjectField(FileModel, multiple=True)

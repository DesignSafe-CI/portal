"""Simulation project models"""
import logging
import six
from designsafe.apps.data.models.agave.base import Model as MetadataModel
from designsafe.apps.data.models.agave import fields
from designsafe.apps.projects.models.agave.base import RelatedEntity, Project

logger = logging.getLogger(__name__)

class SimulationProject(Project):
    model_name = 'designsafe.project'
    team_members = fields.ListField('Team Members')
    co_pis = fields.ListField('Co PIs')
    project_type = fields.CharField('Project Type', max_length=255, default='simulation')
    project_id = fields.CharField('Project Id')
    description = fields.CharField('Description', max_length=1024, default='')
    title = fields.CharField('Title', max_length=255, default='')
    pi = fields.CharField('PI', max_length=255)
    award_number = fields.CharField('Award Number', max_length=255)
    associated_projects = fields.ListField('Associated Project')
    ef = fields.CharField('Experimental Facility', max_length=512)
    keywords = fields.CharField('Keywords')

class FileModel(MetadataModel):
    model_name = 'designsafe.file'
    keywords = fields.ListField('Keywords')
    project_UUID = fields.RelatedObjectField(SimulationProject, default=[])

class DataTag(MetadataModel):
    _is_nested = True
    file = fields.RelatedObjectField(FileModel, default=[])
    desc = fields.CharField('Description', max_length=512, default='')

class SimulationModel(RelatedEntity):
    model_name = 'designsafe.project.simulation'
    title = fields.CharField('Title', max_length=1024)
    application_version = fields.CharField('Application & Version', default='')
    application_version_desc = fields.CharField('Application & Version Description', default='')
    nh_type = fields.CharField('Natural Hazard Type', default='')
    simulated_system = fields.CharField('Simulated System', default='')
    description = fields.CharField('Description', max_length=1024, default='')
    authors = fields.ListField('Authors')
    project = fields.RelatedObjectField(SimulationProject)

class ModelConfig(RelatedEntity):
    model_name = 'designsafe.project.simulation.model'
    title = fields.CharField('Title', max_length=512)
    description = fields.CharField('Description', max_length=1024, default='')
    project = fields.RelatedObjectField(SimulationProject)
    simulations = fields.RelatedObjectField(SimulationModel)
    files = fields.RelatedObjectField(FileModel, multiple=True)

class SimInput(RelatedEntity):
    model_name = 'designsafe.project.simulation.input'
    title = fields.CharField('Title', max_length=512)
    description = fields.CharField('Description', max_length=1024, default='')
    project = fields.RelatedObjectField(SimulationProject)
    simulations = fields.RelatedObjectField(SimulationModel)
    model_configs = fields.RelatedObjectField(ModelConfig)
    files = fields.RelatedObjectField(FileModel, multiple=True)

class SimOutput(RelatedEntity):
    model_name = 'designsafe.project.simulation.output'
    title = fields.CharField('Title', max_length=512)
    description = fields.CharField('Description', max_length=1024, default='')
    project = fields.RelatedObjectField(SimulationProject)
    simulations = fields.RelatedObjectField(SimulationModel)
    model_configs = fields.RelatedObjectField(ModelConfig)
    sim_inputs = fields.RelatedObjectField(SimInput)
    files = fields.RelatedObjectField(FileModel, multiple=True)

class IntegratedDataAnalysis(RelatedEntity):
    model_name = 'designsafe.project.simulation.integrated_data_analysis'
    title = fields.CharField('Title', max_length=1024)
    description = fields.CharField('Description', max_length=1024, default='')
    project = fields.RelatedObjectField(SimulationProject)
    simulations = fields.RelatedObjectField(SimulationModel)
    model_configs = fields.RelatedObjectField(ModelConfig)
    sim_inputs = fields.RelatedObjectField(SimInput)
    files = fields.RelatedObjectField(FileModel, multiple=True)

class IntegratedReport(RelatedEntity):
    model_name = 'designsafe.project.simulation.integrated_report'
    title = fields.CharField('Title', max_length=1024)
    description = fields.CharField('Description', max_length=1024, default='')
    project = fields.RelatedObjectField(SimulationProject)
    simulations = fields.RelatedObjectField(SimulationModel)
    model_configs = fields.RelatedObjectField(ModelConfig)
    sim_inputs = fields.RelatedObjectField(SimInput)
    files = fields.RelatedObjectField(FileModel, multiple=True)

class Analysis(RelatedEntity):
    model_name = 'designsafe.project.analysis'
    title = fields.CharField('Title', max_length=1024)
    description = fields.CharField('Description', max_length=1024, default='')
    project = fields.RelatedObjectField(SimulationProject)
    files = fields.RelatedObjectField(FileModel, multiple=True)

class Report(RelatedEntity):
    model_name = 'designsafe.project.integrated_report'
    title = fields.CharField('Title', max_length=1024)
    description = fields.CharField('Description', max_length=1024, default='')
    project = fields.RelatedObjectField(SimulationProject)
    simulations = fields.RelatedObjectField(SimulationModel)
    files = fields.RelatedObjectField(FileModel, multiple=True)
>>>>>>> 62dec102... Adding simulation models

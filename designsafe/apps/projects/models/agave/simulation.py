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
    guest_members = fields.ListField('Guest Members')
    project_type = fields.CharField('Project Type', max_length=255, default='simulation')
    project_id = fields.CharField('Project Id')
    description = fields.CharField('Description', max_length=1024, default='')
    title = fields.CharField('Title', max_length=255, default='')
    pi = fields.CharField('PI', max_length=255)
    award_number = fields.ListField('Award Number')
    associated_projects = fields.ListField('Associated Project')
    ef = fields.CharField('Experimental Facility', max_length=512)
    keywords = fields.CharField('Keywords')

class FileModel(MetadataModel):
    model_name = 'designsafe.file'
    keywords = fields.ListField('Keywords')
    project_UUID = fields.RelatedObjectField(SimulationProject, default=[])

class DataTag(MetadataModel):
    _is_nested = True
    file_uuid = fields.CharField('File Uuid', max_length=1024, default='')
    tag_name = fields.CharField('Tag Name', max_length=512, default='')
    value = fields.CharField('Value', max_length=512, default='')


class Simulation(RelatedEntity):
    model_name = 'designsafe.project.simulation'
    title = fields.CharField('Title', max_length=1024)
    simulation_type = fields.CharField('Simulation Type', max_length=1024)
    simulation_type_other = fields.CharField('Simulation Type Other', max_length=1024)
    description = fields.CharField('Description', max_length=1024, default='')
    authors = fields.ListField('Authors')
    project = fields.RelatedObjectField(SimulationProject)


class Model(RelatedEntity):
    model_name = 'designsafe.project.simulation.model'
    title = fields.CharField('Title', max_length=512)
    application_version = fields.CharField('Application & Version', default='')
    application_version_other = fields.CharField('Application & Version Other', default='')
    application_version_desc = fields.CharField('Application & Version Description', default='')
    nh_type = fields.CharField('Natural Hazard Type', default='')
    nh_type_other = fields.CharField('Natural Hazard Type Other', default='')
    simulated_system = fields.CharField('Simulated System', default='')
    description = fields.CharField('Description', max_length=1024, default='')
    project = fields.RelatedObjectField(SimulationProject)
    simulations = fields.RelatedObjectField(Simulation)
    files = fields.RelatedObjectField(FileModel, multiple=True)
    file_tags = fields.ListField('File Tags', list_cls=DataTag)


class Input(RelatedEntity):
    model_name = 'designsafe.project.simulation.input'
    title = fields.CharField('Title', max_length=512)
    description = fields.CharField('Description', max_length=1024, default='')
    project = fields.RelatedObjectField(SimulationProject)
    simulations = fields.RelatedObjectField(Simulation)
    model_configs = fields.RelatedObjectField(Model)
    files = fields.RelatedObjectField(FileModel, multiple=True)
    file_tags = fields.ListField('File Tags', list_cls=DataTag)


class Output(RelatedEntity):
    model_name = 'designsafe.project.simulation.output'
    title = fields.CharField('Title', max_length=512)
    description = fields.CharField('Description', max_length=1024, default='')
    project = fields.RelatedObjectField(SimulationProject)
    simulations = fields.RelatedObjectField(Simulation)
    model_configs = fields.RelatedObjectField(Model)
    sim_inputs = fields.RelatedObjectField(Input)
    files = fields.RelatedObjectField(FileModel, multiple=True)
    file_tags = fields.ListField('File Tags', list_cls=DataTag)


class Analysis(RelatedEntity):
    model_name = 'designsafe.project.simulation.analysis'
    title = fields.CharField('Title', max_length=1024)
    description = fields.CharField('Description', max_length=1024, default='')
    refs = fields.ListField('References')
    project = fields.RelatedObjectField(SimulationProject)
    simulations = fields.RelatedObjectField(Simulation)
    sim_outputs = fields.RelatedObjectField(Output)
    files = fields.RelatedObjectField(FileModel, multiple=True)
    file_tags = fields.ListField('File Tags', list_cls=DataTag)


class Report(RelatedEntity):
    model_name = 'designsafe.project.simulation.report'
    title = fields.CharField('Title', max_length=1024)
    description = fields.CharField('Description', max_length=1024, default='')
    project = fields.RelatedObjectField(SimulationProject)
    simulations = fields.RelatedObjectField(Simulation)
    sim_outputs = fields.RelatedObjectField(Output)
    files = fields.RelatedObjectField(FileModel, multiple=True)
    file_tags = fields.ListField('File Tags', list_cls=DataTag)

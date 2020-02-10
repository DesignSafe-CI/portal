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
    guest_members = fields.ListField('Guest Members')
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
    award_number = fields.ListField('Award Number')
    associated_projects = fields.ListField('Associated Project')
    ef = fields.CharField('Experimental Facility', max_length=512, default='')
    keywords = fields.CharField('Keywords', default='')
    dois = fields.ListField('Dois')

class FileModel(MetadataModel):
    model_name = 'designsafe.file'
    keywords = fields.ListField('Keywords')
    project_UUID = fields.RelatedObjectField(HybridSimulationProject, default=[])

class DataTag(MetadataModel):
    _is_nested = True
    file_uuid = fields.CharField('File Uuid', max_length=1024, default='')
    tag_name = fields.CharField('Tag Name', max_length=512, default='')
    value = fields.CharField('Value', max_length=512, default='')


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
    dois = fields.ListField('Dois')

    def to_datacite_json(self):
        """Serialize object to datacite JSON."""
        attributes = super(HybridSimulation, self).to_datacite_json()
        if self.simulation_type_other:
            attributes['types']['resourceType'] = "Simulation/{simulation_type}".format(
                simulation_type=self.simulation_type_other.title()
            )
        else:
            attributes['types']['resourceType'] = "Simulation/{simulation_type}".format(
                simulation_type=self.simulation_type.title()
            )
        return attributes


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
    file_tags = fields.ListField('File Tags', list_cls=DataTag)


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
    file_tags = fields.ListField('File Tags', list_cls=DataTag)


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
    file_tags = fields.ListField('File Tags', list_cls=DataTag)


class ExpSubstructure(RelatedEntity):
    model_name = 'designsafe.project.hybrid_simulation.exp_substructure'
    title = fields.CharField('Title', max_length=512)
    description = fields.CharField('Description', max_length=1024, default='')
    project = fields.RelatedObjectField(HybridSimulationProject)
    hybrid_simulations = fields.RelatedObjectField(HybridSimulation)
    global_models = fields.RelatedObjectField(GlobalModel)
    coordinators = fields.RelatedObjectField(Coordinator)
    files = fields.RelatedObjectField(FileModel, multiple=True)
    file_tags = fields.ListField('File Tags', list_cls=DataTag)


class CoordinatorOutput(RelatedEntity):
    model_name = 'designsafe.project.hybrid_simulation.coordinator_output'
    title = fields.CharField('Title', max_length=512)
    description = fields.CharField('Description', max_length=1024, default='')
    project = fields.RelatedObjectField(HybridSimulationProject)
    hybrid_simulations = fields.RelatedObjectField(HybridSimulation)
    global_models = fields.RelatedObjectField(GlobalModel)
    coordinators = fields.RelatedObjectField(Coordinator)
    files = fields.RelatedObjectField(FileModel, multiple=True)
    file_tags = fields.ListField('File Tags', list_cls=DataTag)


class SimOutput(RelatedEntity):
    model_name = 'designsafe.project.hybrid_simulation.sim_output'
    title = fields.CharField('Title', max_length=512)
    description = fields.CharField('Description', max_length=1024, default='')
    project = fields.RelatedObjectField(HybridSimulationProject)
    hybrid_simulations = fields.RelatedObjectField(HybridSimulation)
    global_models = fields.RelatedObjectField(GlobalModel)
    sim_substructures = fields.RelatedObjectField(SimSubstructure)
    files = fields.RelatedObjectField(FileModel, multiple=True)
    file_tags = fields.ListField('File Tags', list_cls=DataTag)


class ExpOutput(RelatedEntity):
    model_name = 'designsafe.project.hybrid_simulation.exp_output'
    title = fields.CharField('Title', max_length=512)
    description = fields.CharField('Description', max_length=1024, default='')
    project = fields.RelatedObjectField(HybridSimulationProject)
    hybrid_simulations = fields.RelatedObjectField(HybridSimulation)
    global_models = fields.RelatedObjectField(GlobalModel)
    exp_substructures = fields.RelatedObjectField(ExpSubstructure)
    files = fields.RelatedObjectField(FileModel, multiple=True)
    file_tags = fields.ListField('File Tags', list_cls=DataTag)


class Analysis(RelatedEntity):
    model_name = 'designsafe.project.hybrid_simulation.analysis'
    title = fields.CharField('Title', max_length=1024)
    description = fields.CharField('Description', max_length=1024, default='')
    refs = fields.ListField('References')
    project = fields.RelatedObjectField(HybridSimulationProject)
    hybrid_simulations = fields.RelatedObjectField(HybridSimulation)
    files = fields.RelatedObjectField(FileModel, multiple=True)
    file_tags = fields.ListField('File Tags', list_cls=DataTag)


class Report(RelatedEntity):
    model_name = 'designsafe.project.hybrid_simulation.report'
    title = fields.CharField('Title', max_length=1024)
    description = fields.CharField('Description', max_length=1024, default='')
    project = fields.RelatedObjectField(HybridSimulationProject)
    hybrid_simulations = fields.RelatedObjectField(HybridSimulation)
    files = fields.RelatedObjectField(FileModel, multiple=True)
    file_tags = fields.ListField('File Tags', list_cls=DataTag)

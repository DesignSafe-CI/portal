"""Simulation project models"""
import logging
import six
from designsafe.apps.data.models.agave.base import Model as MetadataModel
from designsafe.apps.data.models.agave import fields
from designsafe.apps.projects.models.agave.base import RelatedEntity, Project, FileObjModel

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
    award_numbers = fields.ListField('Award Numbers')
    associated_projects = fields.ListField('Associated Project')
    referenced_data = fields.ListField('Referenced Data')
    ef = fields.CharField('Experimental Facility', max_length=512, default='')
    keywords = fields.CharField('Keywords', default='')
    nh_event = fields.CharField('Natural Hazard Event', default='')
    nh_event_start = fields.CharField('Date Start', max_length=1024, default='')
    nh_event_end = fields.CharField('Date End', max_length=1024, default='')
    nh_location = fields.CharField('Natural Hazard Location', default='')
    nh_latitude = fields.CharField('Natural Hazard Latitude', default='')
    nh_longitude = fields.CharField('Natural Hazard Longitude', default='')
    nh_types = fields.ListField('Natural Hazard Type')
    dois = fields.ListField('Dois')
    hazmapper_maps = fields.ListField('Hazmapper Maps')

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
    referenced_data = fields.ListField('Referenced Data')
    related_work = fields.ListField('Related Work')
    description = fields.CharField('Description', max_length=1024, default='')
    authors = fields.ListField('Authors')
    project = fields.RelatedObjectField(SimulationProject)
    dois = fields.ListField('Dois')

    def to_datacite_json(self):
        """Serialize object to datacite JSON."""
        attributes = super(Simulation, self).to_datacite_json()
        if self.simulation_type_other:
            attributes['types']['resourceType'] = "Simulation/{simulation_type}".format(
                simulation_type=self.simulation_type_other.title()
            )
        else:
            attributes['types']['resourceType'] = "Simulation/{simulation_type}".format(
                simulation_type=self.simulation_type.title()
            )
        # related works are not required, so they can be missing...
        attributes['relatedIdentifiers'] = []
        for r_work in self.related_work:
            identifier = {}
            mapping = {'Linked Project': 'IsPartOf', 'Linked Dataset': 'IsPartOf', 'Cited By': 'IsCitedBy', 'Context': 'IsDocumentedBy'}
            if {'type', 'href', 'hrefType'} <= r_work.keys():
                identifier['relationType'] = mapping[r_work['type']]
                identifier['relatedIdentifierType'] = r_work['hrefType']
                identifier['relatedIdentifier'] = r_work['href']
                attributes['relatedIdentifiers'].append(identifier)

        for r_data in self.referenced_data:
            identifier = {}
            if {'doi', 'hrefType'} <= r_data.keys():
                identifier['relationType'] = 'References'
                identifier['relatedIdentifier'] = r_data['doi']
                identifier['relatedIdentifierType'] = r_data['hrefType']
                attributes['relatedIdentifiers'].append(identifier)
        if not len(attributes['relatedIdentifiers']):
            del attributes['relatedIdentifiers']

        return attributes

    def to_dataset_json(self):
        """Serialize object to dataset JSON."""
        attributes = super(Simulation, self).to_dataset_json()
        if self.simulation_type_other:
            attributes['types']['resourceType'] = "Simulation/{simulation_type}".format(
                simulation_type=self.simulation_type_other.title()
            )
        else:
            attributes['types']['resourceType'] = "Simulation/{simulation_type}".format(
                simulation_type=self.simulation_type.title()
            )
        return attributes


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
    file_objs = fields.ListField('File Objects', list_cls=FileObjModel)


class Input(RelatedEntity):
    model_name = 'designsafe.project.simulation.input'
    title = fields.CharField('Title', max_length=512)
    description = fields.CharField('Description', max_length=1024, default='')
    project = fields.RelatedObjectField(SimulationProject)
    simulations = fields.RelatedObjectField(Simulation)
    model_configs = fields.RelatedObjectField(Model)
    files = fields.RelatedObjectField(FileModel, multiple=True)
    file_tags = fields.ListField('File Tags', list_cls=DataTag)
    file_objs = fields.ListField('File Objects', list_cls=FileObjModel)


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
    file_objs = fields.ListField('File Objects', list_cls=FileObjModel)


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
    file_objs = fields.ListField('File Objects', list_cls=FileObjModel)


class Report(RelatedEntity):
    model_name = 'designsafe.project.simulation.report'
    title = fields.CharField('Title', max_length=1024)
    description = fields.CharField('Description', max_length=1024, default='')
    project = fields.RelatedObjectField(SimulationProject)
    simulations = fields.RelatedObjectField(Simulation)
    sim_outputs = fields.RelatedObjectField(Output)
    files = fields.RelatedObjectField(FileModel, multiple=True)
    file_tags = fields.ListField('File Tags', list_cls=DataTag)
    file_objs = fields.ListField('File Objects', list_cls=FileObjModel)

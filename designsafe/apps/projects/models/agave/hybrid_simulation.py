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
    referenced_data = fields.ListField('Referenced Data')
    related_work = fields.ListField('Related Work')
    authors = fields.ListField('Authors')
    project = fields.RelatedObjectField(HybridSimulationProject)
    dois = fields.ListField('Dois')

    def to_datacite_json(self, project=None):
        if project is None:
            project={}
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
        if hasattr(self, 'facility') and len(self.facility) and ('None' not in self.facility):
            attributes["subjects"] = attributes.get("subjects", []) + [
                {"subject": self.facility.title() }
            ]
            attributes["contributors"] = attributes.get("contributors", []) + [
                {
                    "contributorType": "HostingInstitution",
                    "nameType": "Organizational",
                    "name": self.facility,
                }
            ]
        # Metadata from project level
        attributes["titles"] = attributes.get("titles", []) + [
            {   "titleType": 'Subtitle',
                "title": project.title }
        ]
        attributes["descriptions"] = attributes.get("descriptions", []) + [
            {
                'descriptionType': 'Abstract',
                'description': project.description,
                'lang': 'en-Us',
            }
        ]
        if len(project.award_number) and type(project.award_number[0]) is not dict:
            project.award_number = [{'order': 0, 'name': ''.join(project.award_number)}]
        awards = sorted(
            project.award_number,
            key=lambda x: (x.get('order', 0), x.get('name', ''))
        )
        attributes['fundingReferences'] = []
        for award in awards:
            attributes['fundingReferences'].append({
                'awardTitle': award['name'],
                'awardNumber': award['number']
                })
        # related works are not required, so they can be missing...
        attributes['relatedIdentifiers'] = []
        for r_work in self.related_work:
            identifier = {}
            mapping = {'Linked Project': 'IsSupplementTo', 'Linked Dataset': 'IsSupplementTo', 'Cited By': 'IsCitedBy', 'Context': 'IsDocumentedBy'}
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
        attributes = super(HybridSimulation, self).to_dataset_json()
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

"""Experimental project models"""
import logging
import six
from designsafe.apps.data.models.agave.base import Model as MetadataModel
from designsafe.apps.data.models.agave import fields
from designsafe.apps.projects.models.agave.base import RelatedEntity, Project, FileObjModel

logger = logging.getLogger(__name__)

class ExperimentalProject(Project):
    model_name = 'designsafe.project'
    team_members = fields.ListField('Team Members')
    co_pis = fields.ListField('Co PIs')
    guest_members = fields.ListField('Guest Members')
    project_type = fields.CharField('Project Type', max_length=255, default='other')
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
    project_UUID = fields.RelatedObjectField(ExperimentalProject, default=[])

class DataTag(MetadataModel):
    _is_nested = True
    file_uuid = fields.CharField('File Uuid', max_length=1024, default='')
    tag_name = fields.CharField('Tag Name', max_length=512, default='')
    value = fields.CharField('Value', max_length=512, default='')


class Experiment(RelatedEntity):
    model_name = 'designsafe.project.experiment'
    experiment_type = fields.CharField('Experiment Type', max_length=255, default='other')
    experiment_type_other = fields.CharField('Experiment Type Other', max_length=255, default='')
    description = fields.CharField('Description', max_length=1024, default='')
    title = fields.CharField('Title', max_length=1024)
    referenced_data = fields.ListField('Referenced Data')
    related_work = fields.ListField('Related Work')
    experimental_facility = fields.CharField('Experimental Facility', max_length=1024)
    experimental_facility_other = fields.CharField('Experimental Facility Other', max_length=1024)
    equipment_type = fields.CharField('Equipment Type')
    equipment_type_other = fields.CharField('Equipment Type Other')
    procedure_start = fields.CharField('Procedure Start', max_length=1024, default='')
    procedure_end = fields.CharField('Procedure End', max_length=1024, default='')
    authors = fields.ListField('Authors')
    project = fields.RelatedObjectField(ExperimentalProject)
    dois = fields.ListField('Dois')

    def to_datacite_json(self, project=None):
        if project is None:
            project={}
        """Serialize object to datacite JSON."""
        attributes = super(Experiment, self).to_datacite_json()
        if hasattr(self, 'experimental_facility') and len(self.experimental_facility) and ('None' not in self.experimental_facility):
            attributes["subjects"] = attributes.get("subjects", []) + [
                {"subject": self.experimental_facility.title(), }
            ]
            attributes["contributors"] = attributes.get("contributors", []) + [
                {
                    "contributorType": "HostingInstitution",
                    "nameType": "Organizational",
                    "name": self.experimental_facility,
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
        attributes['types']['resourceType'] = "Experiment/{experiment_type}".format(
            experiment_type=self.experiment_type.title()
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
        attributes = super(Experiment, self).to_dataset_json()
        attributes["subjects"] = attributes.get("subjects", []) + [
            {"subject": self.experimental_facility.title(), }
        ]
        attributes["contributors"] = attributes.get("contributors", []) + [
            {
                "contributorType": "HostingInstitution",
                "nameType": "Organizational",
                "name": self.experimental_facility,
            }
        ]
        attributes['types']['resourceType'] = "Experiment/{experiment_type}".format(
            experiment_type=self.experiment_type.title()
        )
        return attributes

class Analysis(RelatedEntity):
    model_name = 'designsafe.project.analysis'
    analysis_type = fields.CharField('Analysis Type', max_length=255, default='other')
    title = fields.CharField('Title', max_length=1024)
    refs = fields.ListField('References')
    description = fields.CharField('Description', max_length=1024, default='')
    analysis_data = fields.CharField('Analysis Data', max_length=1024, default='')
    application = fields.CharField('Analysis Data', max_length=1024, default='')
    script = fields.RelatedObjectField(FileModel, multiple=True)
    project = fields.RelatedObjectField(ExperimentalProject)
    experiments = fields.RelatedObjectField(Experiment)
    files = fields.RelatedObjectField(FileModel, multiple=True)
    file_tags = fields.ListField('File Tags', list_cls=DataTag)
    file_objs = fields.ListField('File Objects', list_cls=FileObjModel)

class ModelConfig(RelatedEntity):
    model_name = 'designsafe.project.model_config'
    title = fields.CharField('Title', max_length=512)
    description = fields.CharField('Description', max_length=1024, default='')
    project = fields.RelatedObjectField(ExperimentalProject)
    experiments = fields.RelatedObjectField(Experiment)
    files = fields.RelatedObjectField(FileModel, multiple=True)
    file_tags = fields.ListField('File Tags', list_cls=DataTag)
    file_objs = fields.ListField('File Objects', list_cls=FileObjModel)

class SensorList(RelatedEntity):
    model_name = 'designsafe.project.sensor_list'
    sensor_list_type = fields.CharField('Sensor List Type', max_length=255, default='other')
    title = fields.CharField('Title', max_length=1024)
    description = fields.CharField('Description', max_length=1024, default='')
    project = fields.RelatedObjectField(ExperimentalProject)
    experiments = fields.RelatedObjectField(Experiment)
    model_configs = fields.RelatedObjectField(ModelConfig)
    files = fields.RelatedObjectField(FileModel, multiple=True)
    file_tags = fields.ListField('File Tags', list_cls=DataTag)
    file_objs = fields.ListField('File Objects', list_cls=FileObjModel)

class Event(RelatedEntity):
    model_name = 'designsafe.project.event'
    event_type = fields.CharField('Event Type', max_length=255, default='other')
    title = fields.CharField('Title', max_length=1024)
    description = fields.CharField('Description', max_length=1024, default='')
    analysis = fields.RelatedObjectField(Analysis)
    project = fields.RelatedObjectField(ExperimentalProject)
    experiments = fields.RelatedObjectField(Experiment)
    model_configs = fields.RelatedObjectField(ModelConfig)
    sensor_lists = fields.RelatedObjectField(SensorList)
    files = fields.RelatedObjectField(FileModel, multiple=True)
    file_tags = fields.ListField('File Tags', list_cls=DataTag)
    file_objs = fields.ListField('File Objects', list_cls=FileObjModel)

class Report(RelatedEntity):
    model_name = 'designsafe.project.report'
    title = fields.CharField('Title', max_length=1024)
    description = fields.CharField('Description', max_length=1024, default='')
    project = fields.RelatedObjectField(ExperimentalProject)
    experiments = fields.RelatedObjectField(Experiment)
    files = fields.RelatedObjectField(FileModel, multiple=True)
    file_tags = fields.ListField('File Tags', list_cls=DataTag)
    file_objs = fields.ListField('File Objects', list_cls=FileObjModel)

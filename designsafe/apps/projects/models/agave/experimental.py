"""Experimental project models"""
import logging
import six
from designsafe.apps.data.models.agave.base import Model as MetadataModel
from designsafe.apps.data.models.agave import fields
from designsafe.apps.projects.models.agave.base import RelatedEntity, Project

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
    ef = fields.CharField('Experimental Facility', max_length=512, default='')
    keywords = fields.CharField('Keywords', default='')
    dois = fields.ListField('Dois')

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
    experimental_facility = fields.CharField('Experimental Facility', max_length=1024)
    experimental_facility_other = fields.CharField('Experimental Facility Other', max_length=1024)
    equipment_type = fields.CharField('Equipment Type')
    equipment_type_other = fields.CharField('Equipment Type Other')
    procedure_start = fields.CharField('Procedure Start', max_length=1024, default='')
    procedure_end = fields.CharField('Procedure End', max_length=1024, default='')
    authors = fields.ListField('Authors')
    project = fields.RelatedObjectField(ExperimentalProject)
    dois = fields.ListField('Dois')

    def to_datacite_json(self):
        """Serialize object to datacite JSON."""
        attributes = super(Experiment, self).to_datacite_json()
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

class ModelConfig(RelatedEntity):
    model_name = 'designsafe.project.model_config'
    title = fields.CharField('Title', max_length=512)
    description = fields.CharField('Description', max_length=1024, default='')
    project = fields.RelatedObjectField(ExperimentalProject)
    experiments = fields.RelatedObjectField(Experiment)
    files = fields.RelatedObjectField(FileModel, multiple=True)
    file_tags = fields.ListField('File Tags', list_cls=DataTag)

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

class Report(RelatedEntity):
    model_name = 'designsafe.project.report'
    title = fields.CharField('Title', max_length=1024)
    description = fields.CharField('Description', max_length=1024, default='')
    project = fields.RelatedObjectField(ExperimentalProject)
    experiments = fields.RelatedObjectField(Experiment)
    files = fields.RelatedObjectField(FileModel, multiple=True)
    file_tags = fields.ListField('File Tags', list_cls=DataTag)

"""Rapid project models"""
import logging
import six
from designsafe.apps.data.models.agave.base import Model as MetadataModel
from designsafe.apps.data.models.agave import fields
from designsafe.apps.projects.models.agave.base import RelatedEntity, Project

logger = logging.getLogger(__name__)

class FieldReconProject(Project):
    model_name = 'designsafe.project.field_recon'
    team_members = fields.ListField('Team Members')
    co_pis = fields.ListField('Co PIs')
    guest_members = fields.ListField('Guest Members')
    project_type = fields.CharField('Project Type', max_length=255, default='other')
    project_id = fields.CharField('Project Id')
    description = fields.CharField('Description', max_length=1024, default='')
    title = fields.CharField('Title', max_length=255, default='')
    pi = fields.CharField('PI', max_length=255)
    award_number = fields.ListField('Award Number')
    associated_projects = fields.ListField('Associated Project')
    ef = fields.CharField('Experimental Facility', max_length=512)
    keywords = fields.CharField('Keywords')
    nh_event = fields.CharField('Natural Hazard Event')
    nh_event_start = fields.CharField('Date Start', max_length=1024, default='')
    nh_event_end = fields.CharField('Date End', max_length=1024, default='')
    nh_type = fields.CharField('Natural Hazard Type', max_length=1024, default='')
    nh_type_other = fields.CharField('Natural Hazard Type', max_length=1024, default='')


class FileModel(MetadataModel):
    model_name = 'designsafe.file'
    keywords = fields.ListField('Keywords')
    project_UUID = fields.RelatedObjectField(FieldReconProject, default=[])


class DataTag(MetadataModel):
    _is_nested = True
    file = fields.RelatedObjectField(FileModel, default=[])
    desc = fields.CharField('Description', max_length=512, default='')


class Mission(RelatedEntity):
    model_name = 'designsafe.project.field_recon.mission'
    title = fields.CharField('Title', max_length=1024)
    date_start = fields.CharField('Date Start', max_length=1024, default='')
    date_end = fields.CharField('Date End', max_length=1024, default='')
    location = fields.CharField('Site Location', max_length=1024)
    latitude = fields.CharField('Location Latitude', max_length=1024)
    longitude = fields.CharField('Location Longitude', max_length=1024)
    elevation = fields.CharField('Location Elevation', max_length=1024)
    authors = fields.ListField('Authors')
    description = fields.CharField('Description', max_length=1024, default='')
    project = fields.RelatedObjectField(FieldReconProject)


class Instrument(MetadataModel):
    _is_nested = True
    name = fields.CharField('Instrument Name', max_length=1024, default='')
    model = fields.CharField('Instrument Model', max_length=2048, default='')


class ReferencedData(MetadataModel):
    _is_nested = True
    title = fields.CharField('Title', max_length=1024, default='')
    doi_url = fields.CharField('Doi or Url', max_length=2048, default='')


class Collection(RelatedEntity):
    model_name = 'designsafe.project.field_recon.collection'
    title = fields.CharField('Title', max_length=1024)
    observation_types = fields.ListField('Observation Type')
    date_start = fields.CharField('Date Start', max_length=1024, default='')
    date_end = fields.CharField('Date End', max_length=1024, default='')
    data_collectors = fields.ListField('Data Collectors')
    guest_data_collectors = fields.ListField('Guest Data Collectors')
    location = fields.CharField('Site Location', max_length=1024)
    latitude = fields.CharField('Location Latitude', max_length=1024)
    longitude = fields.CharField('Location Longitude', max_length=1024)
    elevation = fields.CharField('Location Elevation', max_length=1024)
    instruments = fields.ListField('Instrument', list_cls=Instrument)
    referenced_datas = fields.ListField('Reference Data', list_cls=ReferencedData)
    description = fields.CharField('Description', max_length=1024, default='')
    project = fields.RelatedObjectField(FieldReconProject)
    missions = fields.RelatedObjectField(Mission)
    files = fields.RelatedObjectField(FileModel, multiple=True)
    file_tags = fields.ListField('File Tags', list_cls=DataTag)

class Report(RelatedEntity):
    model_name = 'designsafe.project.field_recon.report'
    title = fields.CharField('Title', max_length=1024)
    data_collectors = fields.ListField('Data Collectors')
    guest_data_collectors = fields.ListField('Guest Data Collectors')
    referenced_datas = fields.ListField('Reference Data', list_cls=ReferencedData)
    description = fields.CharField('Description', max_length=1024, default='')
    project = fields.RelatedObjectField(FieldReconProject)
    missions = fields.RelatedObjectField(Mission)
    files = fields.RelatedObjectField(FileModel, multiple=True)
    file_tags = fields.ListField('File Tags', list_cls=DataTag)

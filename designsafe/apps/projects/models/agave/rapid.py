"""Rapid project models"""
import logging
import json
from designsafe.apps.data.models.agave.base import Model as MetadataModel
from designsafe.apps.data.models.agave import fields
from designsafe.apps.projects.models.agave.base import RelatedEntity, Project

logger = logging.getLogger(__name__)

class FieldReconProject(Project):
    def __init__(self, *args, **kwargs):
        """Override init to move nh_type to nh_types list.

        We should be able to remove this after a few months in prod.
        """
        nh_type = kwargs.get('value', {}).get('nhType')
        nh_type_other = kwargs.get('value', {}).get('nhTypeOther')
        if nh_type:
            kwargs['value']['nhTypes'] = [nh_type]
        if nh_type_other:
            kwargs['value']['nhTypes'] = [nh_type_other]
        super(FieldReconProject, self).__init__(*args, **kwargs)

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
    keywords = fields.CharField('Keywords')
    nh_event = fields.CharField('Natural Hazard Event', default='')
    nh_event_start = fields.CharField('Date Start', max_length=1024, default='')
    nh_event_end = fields.CharField('Date End', max_length=1024, default='')
    nh_location = fields.CharField('Natural Hazard Location', default='')
    nh_latitude = fields.CharField('Natural Hazard Latitude', default='')
    nh_longitude = fields.CharField('Natural Hazard Longitude', default='')
    nh_types = fields.ListField('Natural Hazard Type')
    fr_types = fields.ListField('Field Research Type')
    dois = fields.ListField('Dois')
    hazmapper_maps = fields.ListField('Hazmapper Maps')


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
    event = fields.CharField('Event', max_length=1024, default='')
    date_start = fields.CharField('Date Start', max_length=1024, default='')
    date_end = fields.CharField('Date End', max_length=1024, default='')
    referenced_data = fields.ListField('Referenced Data')
    related_work = fields.ListField('Related Work')
    facility = fields.BaseField()
    location = fields.CharField('Site Location', max_length=1024)
    latitude = fields.CharField('Location Latitude', max_length=1024)
    longitude = fields.CharField('Location Longitude', max_length=1024)
    elevation = fields.CharField('Location Elevation', max_length=1024)
    authors = fields.ListField('Authors')
    description = fields.CharField('Description', max_length=1024, default='')
    project = fields.RelatedObjectField(FieldReconProject)
    dois = fields.ListField('Dois')

    def to_datacite_json(self):
        """Serialize object to datacite JSON."""
        attributes = super(Mission, self).to_datacite_json()
        attributes['types']['resourceType'] = "Mission/{location}".format(
            location=self.location.title()
        )
        if self.facility:
            attributes["subjects"] = attributes.get("subjects", []) + [
                {"subject": self.facility["name"], }
            ]
            attributes["contributors"] = attributes.get("contributors", []) + [
                {
                    "contributorType": "HostingInstitution",
                    "nameType": "Organizational",
                    "name": self.facility["name"],
                }
            ]
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
        attributes = super(Mission, self).to_dataset_json()
        attributes["subjects"] = attributes.get("subjects", []) + [
            {"subject": self.facility.title(), }
        ]
        attributes["contributors"] = attributes.get("contributors", []) + [
            {
                "contributorType": "HostingInstitution",
                "nameType": "Organizational",
                "name": self.facility,
            }
        ]
        attributes['types']['resourceType'] = "Mission/{location}".format(
            location=self.location.title()
        )
        return attributes


class Instrument(MetadataModel):
    _is_nested = True
    name = fields.CharField('Instrument Name', max_length=1024, default='')
    model = fields.CharField('Instrument Model', max_length=2048, default='')

class Equipment(MetadataModel):
    _is_nested = True
    name = fields.CharField('Equipment Name', max_length=1024, default='')
    model = fields.CharField('Equipment Model', max_length=2048, default='')


class ReferencedData(MetadataModel):
    _is_nested = True
    title = fields.CharField('Title', max_length=1024, default='')
    doi_url = fields.CharField('Doi or Url', max_length=2048, default='')

# FR ver1 Collections
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

class SocialScience(RelatedEntity):
    model_name = 'designsafe.project.field_recon.social_science'
    title = fields.CharField('Title', max_length=1024)
    unit = fields.CharField('Unit of Analysis', max_length=1024)
    modes = fields.ListField('Modes of Collection')
    sample_approach = fields.ListField('Sampling Approaches')
    sample_size = fields.CharField('Sampling Size', max_length=1024)
    date_start = fields.CharField('Date Start', max_length=1024, default='')
    date_end = fields.CharField('Date End', max_length=1024, default='')
    data_collectors = fields.ListField('Data Collectors')
    location = fields.CharField('Site Location', max_length=1024)
    latitude = fields.CharField('Location Latitude', max_length=1024)
    longitude = fields.CharField('Location Longitude', max_length=1024)
    equipment = fields.ListField('Equipment', list_cls=Equipment)
    restriction = fields.CharField('Restriction', max_length=1024)
    referenced_data = fields.ListField('Reference Data', list_cls=ReferencedData)
    description = fields.CharField('Description', max_length=1024, default='')
    project = fields.RelatedObjectField(FieldReconProject)
    missions = fields.RelatedObjectField(Mission)
    files = fields.RelatedObjectField(FileModel, multiple=True)
    file_tags = fields.ListField('File Tags', list_cls=DataTag)

class Planning(RelatedEntity):
    model_name = 'designsafe.project.field_recon.planning'
    title = fields.CharField('Title', max_length=1024)
    data_collectors = fields.ListField('Data Collectors')
    referenced_data = fields.ListField('Reference Data', list_cls=ReferencedData)
    description = fields.CharField('Description', max_length=1024, default='')
    project = fields.RelatedObjectField(FieldReconProject)
    missions = fields.RelatedObjectField(Mission)
    files = fields.RelatedObjectField(FileModel, multiple=True)
    file_tags = fields.ListField('File Tags', list_cls=DataTag)

class Geoscience(RelatedEntity):
    model_name = 'designsafe.project.field_recon.geoscience'
    title = fields.CharField('Title', max_length=1024)
    observation_types = fields.ListField('Observation Type')
    date_start = fields.CharField('Date Start', max_length=1024, default='')
    date_end = fields.CharField('Date End', max_length=1024, default='')
    data_collectors = fields.ListField('Data Collectors')
    location = fields.CharField('Site Location', max_length=1024)
    latitude = fields.CharField('Location Latitude', max_length=1024)
    longitude = fields.CharField('Location Longitude', max_length=1024)
    equipment = fields.ListField('Equipment', list_cls=Equipment)
    referenced_data = fields.ListField('Reference Data', list_cls=ReferencedData)
    description = fields.CharField('Description', max_length=1024, default='')
    project = fields.RelatedObjectField(FieldReconProject)
    missions = fields.RelatedObjectField(Mission)
    files = fields.RelatedObjectField(FileModel, multiple=True)
    file_tags = fields.ListField('File Tags', list_cls=DataTag)

class Report(RelatedEntity):
    model_name = 'designsafe.project.field_recon.report'
    title = fields.CharField('Title', max_length=1024)
    authors = fields.ListField('Authors')
    referenced_data = fields.ListField('Referenced Data')
    related_work = fields.ListField('Related Work')
    facility = fields.BaseField()
    description = fields.CharField('Description', max_length=1024, default='')
    project = fields.RelatedObjectField(FieldReconProject)
    files = fields.RelatedObjectField(FileModel, multiple=True)
    file_tags = fields.ListField('File Tags', list_cls=DataTag)
    dois = fields.ListField('Dois')

    def to_datacite_json(self):
        """Serialize object to datacite JSON."""
        attributes = super(Report, self).to_datacite_json()
        attributes['types']['resourceType'] = "Project/Report"
        if self.facility:
            attributes["subjects"] = attributes.get("subjects", []) + [
                {"subject": self.facility["name"], }
            ]
            attributes["contributors"] = attributes.get("contributors", []) + [
                {
                    "contributorType": "HostingInstitution",
                    "nameType": "Organizational",
                    "name": self.facility["name"],
                }
            ]
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
        attributes = super(Report, self).to_dataset_json()
        attributes["subjects"] = attributes.get("subjects", []) + [
            {"subject": self.facility.title(), }
        ]
        attributes["contributors"] = attributes.get("contributors", []) + [
            {
                "contributorType": "HostingInstitution",
                "nameType": "Organizational",
                "name": self.facility,
            }
        ]
        attributes['types']['resourceType'] = "Project/Report"
        return attributes

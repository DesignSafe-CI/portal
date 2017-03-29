import six
import json
import logging

from designsafe.apps.api.agave.models.metadata import (BaseMetadataResource,
                                                       BaseMetadataPermissionResource)
from designsafe.apps.api.agave.models.files import (BaseFileResource,
                                                    BaseFilePermissionResource,
                                                    BaseFileMetadata)
from designsafe.apps.api.agave.models.systems import BaseSystemResource
from designsafe.apps.api.agave.models.systems import roles as system_roles
from designsafe.apps.api.agave import to_camel_case
from designsafe.apps.api.agave.models.base import Model as MetadataModel
from designsafe.apps.api.agave.models import fields

logger = logging.getLogger(__name__)


class Project(BaseMetadataResource):
    """
    A Project represents a data collection with associated metadata. The base object for
    a project is a metadata object of the name (type) `designsafe.project`. Associated
    with this metadata object through `associationIds` is a directory in the Agave Files
    API that contains all the data for the project. Additional metadata may also be
    associated to the project and to other Files objects within the Project collection.
    """

    NAME = 'designsafe.project'
    STORAGE_SYSTEM_ID = 'designsafe.storage.projects'

    def __init__(self, agave_client, **kwargs):
        defaults = {
            'name': Project.NAME
        }
        defaults.update(kwargs)
        super(Project, self).__init__(agave_client, **defaults)

        # initialize properties cache attributes
        self._project_directory = None
        self._project_system = None

    @classmethod
    def list_projects(cls, agave_client):
        """
        Get a list of Projects
        :param agave_client: agavepy.Agave: Agave API client instance
        :return:
        """
        query = {
            'name': Project.NAME
        }
        records = agave_client.meta.listMetadata(q=json.dumps(query), privileged=False)
        return [cls(agave_client=agave_client, **r) for r in records]

    def team_members(self):
        permissions = BaseMetadataPermissionResource.list_permissions(
            self.uuid, self._agave)
        logger.debug('self.value: %s', self.value)
        pi = self.pi

        co_pis_list = getattr(self, 'co_pis', [])
        co_pis = []
        if co_pis_list:
            co_pis = [x.username for x in permissions if x.username in co_pis_list]

        team_members_list = [x.username for x in permissions if x.username not in co_pis + [pi]]
        return {'pi': pi,
                'coPis': co_pis,
                'teamMembers': team_members_list}

    @property
    def collaborators(self):
        permissions = BaseMetadataPermissionResource.list_permissions(
            self.uuid, self._agave)
        return [pem.username for pem in permissions]

    def add_collaborator(self, username):
        logger.info('Adding collaborator "{}" to project "{}"'.format(username, self.uuid))

        # Set permissions on the metadata record
        pem = BaseMetadataPermissionResource(self.uuid, self._agave)
        pem.username = username
        pem.read = True
        pem.write = True
        pem.save()

        # Set roles on project system
        self.project_system.add_role(username, system_roles.USER)

    def remove_collaborator(self, username):
        logger.info('Removing collaborator "{}" from project "{}"'.format(username, self.uuid))

        # Set permissions on the metadata record
        pem = BaseMetadataPermissionResource(self.uuid, self._agave)
        pem.username = username
        pem.read = False
        pem.write = False
        pem.save()

        # Set roles on project system
        self.project_system.remove_role(username)

    def update(self, **kwargs):
        '''Updates metadata values.

        This function should be used when updating or adding
        values to the metadata objects.

        :param dict kwargs: key = value of attributes to add/update in the object.
        :returns: itself for chainability
        :rtype: :class:`Project`

        ..note::
            When updating PIs, CO-PIs, team members or collaborators.
            Remember to use :func:`add_collaborator` or :func:`remove_collaborator` respectively.
        '''
        logger.debug('updating project metadata: {"id": "%s", "updates": %s}', self.uuid, kwargs)
        for key, value in six.iteritems(kwargs):
            camel_key = to_camel_case(key)
            self.value[camel_key] = value

    @property
    def title(self):
        return self.value.get('title')

    @title.setter
    def title(self, value):
        self.value['title'] = value

    @property
    def pi(self):
        return self.value.get('pi')

    @pi.setter
    def pi(self, value):
        self.value['pi'] = value

    @property
    def co_pis(self):
        return self.value.get('coPis', [])

    @co_pis.setter
    def co_pis(self, value):
        # TODO is this assertion valuable?
        # assert self.pi not in value
        self.value['coPis'] = value

    @property
    def abstract(self):
        return self.value.get('abstract')

    @abstract.setter
    def abstract(self, value):
        self.value['abstract'] = value

    @property
    def project_directory(self):
        """
        Queries for the File object that represents the root of this Project's files.

        :return: The project's root dir
        :rtype: :class:`BaseFileResource`
        """
        if self._project_directory is None:
            self._project_directory = BaseFileResource.listing(
                system=self.project_system_id, path='/', agave_client=self._agave)
        return self._project_directory

    @property
    def project_system(self):
        if self._project_system is None:
            self._project_system = BaseSystemResource.from_id(self._agave,
                                                              self.project_system_id)
        return self._project_system

    @property
    def project_system_id(self):
        return 'project-{}'.format(self.uuid)

    @property
    def project_data_listing(self, path='/'):
        return BaseFileResource.listing(system=self.project_system_id,
                                        path=path,
                                        agave_client=self._agave)


class RelatedEntity(MetadataModel):
    def to_body_dict(self):
        body_dict = super(RelatedEntity, self).to_body_dict()
        body_dict['_relatedFields'] = []
        for attrname, field in six.iteritems(self._meta._related_fields):
            body_dict['_relatedFields'].append(attrname)
        return body_dict 

class ExperimentalProject(MetadataModel):
    model_name = 'designsafe.project'
    team_members = fields.ListField('Team Members')
    project_type = fields.CharField('Project Type', max_length=255, default='other')
    description = fields.CharField('Description', max_length=1024, default='')
    title = fields.CharField('Title', max_length=255, default='')
    pi = fields.CharField('Pi', max_length=255)
    award_number = fields.CharField('Award Number', max_length=255)
    associated_projects = fields.ListField('Associated Project')
    ef = fields.CharField('Experimental Facility', max_length=512)

    def to_body_dict(self):
        body_dict = super(ExperimentalProject, self).to_body_dict()
        body_dict['_related'] = {}
        for attrname, field in six.iteritems(self._meta._related_fields):
            body_dict['_related'][attrname] = field.rel_cls.model_name

        for attrname in self._meta._reverse_fields:
            field = getattr(self, attrname)
            body_dict['_related'][attrname] = field.related_obj_name

        return body_dict

class FileModel(MetadataModel):
    model_name = 'designsafe.file'
    keywords = fields.ListField('Keywords')
    project_UUID = fields.RelatedObjectField(ExperimentalProject, default=[])

class DataTag(MetadataModel):
    _is_nested = True
    file = fields.RelatedObjectField(FileModel, default=[])
    desc = fields.CharField('Description', max_length=512, default='')

class Experiment(RelatedEntity):
    model_name = 'designsafe.project.experiment'
    experiment_type = fields.CharField('Experiment Type', max_length=255, default='other')
    description = fields.CharField('Description', max_length=1024, default='')
    title = fields.CharField('Title', max_length=1024)
    experimental_facility = fields.CharField('Experimental Facility', max_length=1024)
    authors = fields.ListField('Authors')
    project = fields.RelatedObjectField(ExperimentalProject)

class Analysis(RelatedEntity):
    model_name = 'designsafe.project.analysis'
    analysis_type = fields.CharField('Analysis Type', max_length=255, default='other')
    title = fields.CharField('Title', max_length=1024)
    description = fields.CharField('Description', max_length=1024, default='')
    analysis_data = fields.CharField('Analysis Data', max_length=1024, default='')
    application = fields.CharField('Analysis Data', max_length=1024, default='')
    script = fields.RelatedObjectField(FileModel, multiple=True)
    project = fields.RelatedObjectField(ExperimentalProject)
    experiments = fields.RelatedObjectField(Experiment)
    #events = fields.RelatedObjectField(Event)
    files = fields.RelatedObjectField(FileModel, multiple=True)

class ModelConfigTagCentrifuge(MetadataModel):
    _is_nested = True
    triaxial_test = fields.ListField('Triaxal Test', list_cls=DataTag)
    soil_strenght = fields.ListField('Soil Strength', list_cls=DataTag)
    hinged_plate_container = fields.ListField('Hinged Plate Container', list_cls=DataTag)
    rigid_container = fields.ListField('Rigid Container', list_cls=DataTag)
    flexible_shear_beam_container = fields.ListField('Flexible Shear Beam Container', list_cls=DataTag)
    structural_model = fields.ListField('Structural Model', list_cls=DataTag)
    gravel = fields.ListField('Gravel', list_cls=DataTag)
    sand = fields.ListField('Sand', list_cls=DataTag)
    silt = fields.ListField('Silt', list_cls=DataTag)
    clay = fields.ListField('Clay', list_cls=DataTag)
    pit = fields.ListField('pit', list_cls=DataTag)

class ModelConfigTagGeneral(MetadataModel):
    _is_nested = True
    triaxial_test = fields.NestedObjectField(DataTag)

class ModelConfigTagShakeTable(MetadataModel):
    _is_nested = True
class ModelConfigTagWave(MetadataModel):
    _is_nested = True
class ModelConfigTagWind(MetadataModel):
    _is_nested = True
    
class ModelConfigTag(MetadataModel):
    _is_nested = True
    centrifuge = fields.NestedObjectField(ModelConfigTagCentrifuge)
    general = fields.NestedObjectField(ModelConfigTagGeneral)
    shake_table = fields.NestedObjectField(ModelConfigTagShakeTable)
    wave = fields.NestedObjectField(ModelConfigTagWave)
    wind = fields.NestedObjectField(ModelConfigTagWind)

class ModelConfiguration(RelatedEntity):
    model_name = 'designsafe.project.model_config'
    title = fields.CharField('Title', max_length=512)
    description = fields.CharField('Description', max_length=1024, default='')
    spatial = fields.CharField('Spatial', max_length=1024)
    lat = fields.CharField('Lat', max_length=1024)
    lon = fields.CharField('Lon', max_length=1024)
    model_drawing = fields.RelatedObjectField(FileModel, multiple=True)
    image = fields.NestedObjectField(DataTag)
    video = fields.NestedObjectField(DataTag)
    tags = fields.NestedObjectField(ModelConfigTag)
    project = fields.RelatedObjectField(ExperimentalProject)
    experiments = fields.RelatedObjectField(Experiment)
    #events = fields.RelatedObjectField(Event)
    files = fields.RelatedObjectField(FileModel, multiple=True)

class SensorList(RelatedEntity):
    model_name = 'designsafe.project.sensor_list'
    sensor_list_type = fields.CharField('Sensor List Type', max_length=255, default='other')
    title = fields.CharField('Title', max_length=1024)
    description = fields.CharField('Description', max_length=1024, default='')
    sensor_drawing = fields.RelatedObjectField(FileModel, multiple=True)
    project = fields.RelatedObjectField(ExperimentalProject)
    experiments = fields.RelatedObjectField(Experiment)
    #events = fields.RelatedObjectField(Event)
    model_configs = fields.RelatedObjectField(ModelConfiguration)
    files = fields.RelatedObjectField(FileModel, multiple=True)

class EventTagCentrifuge(MetadataModel):
    _is_nested=True
class EventTagGeneral(MetadataModel):
    _is_nested=True
class EventTagShakeTable(MetadataModel):
    _is_nested=True
class EventTagWave(MetadataModel):
    _is_nested=True
class EventTagWind(MetadataModel):
    _is_nested=True

class EventTag(MetadataModel):
    _is_nested = True
    centrifuge = fields.NestedObjectField(EventTagCentrifuge)
    general = fields.NestedObjectField(EventTagGeneral)
    shake_table = fields.NestedObjectField(EventTagShakeTable)
    wave = fields.NestedObjectField(EventTagWave)
    wind = fields.NestedObjectField(EventTagWind)

class Event(RelatedEntity):
    model_name = 'designsafe.project.event'
    event_type = fields.CharField('Event Type', max_length=255, default='other')
    title = fields.CharField('Title', max_length=1024)
    description = fields.CharField('Description', max_length=1024, default='')
    load = fields.RelatedObjectField(FileModel, multiple=True)
    project = fields.RelatedObjectField(ExperimentalProject)
    experiments = fields.RelatedObjectField(Experiment)
    model_configs = fields.RelatedObjectField(ModelConfiguration)
    sensor_lists = fields.RelatedObjectField(SensorList)
    files = fields.RelatedObjectField(FileModel, multiple=True)

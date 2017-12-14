"""Base"""
import logging
import six
from designsafe.apps.data.models.agave.base import Model as MetadataModel
from designsafe.apps.data.models.agave import fields

logger = logging.getLogger(__name__)

class RelatedEntity(MetadataModel):
    def to_body_dict(self):
        body_dict = super(RelatedEntity, self).to_body_dict()
        body_dict['_relatedFields'] = []
        for attrname, field in six.iteritems(self._meta._related_fields):
            body_dict['_relatedFields'].append(attrname)
        return body_dict

class Project(MetadataModel):
    model_name = 'designsafe.project'
    team_members = fields.ListField('Team Members')
    co_pis = fields.ListField('Co PIs')
    project_type = fields.CharField('Project Type', max_length=255, default='other')
    project_id = fields.CharField('Project Id')
    description = fields.CharField('Description', max_length=1024, default='')
    title = fields.CharField('Title', max_length=255, default='')
    pi = fields.CharField('PI', max_length=255)
    award_number = fields.CharField('Award Number', max_length=255)
    associated_projects = fields.ListField('Associated Project')
    ef = fields.CharField('Experimental Facility', max_length=512)
    keywords = fields.CharField('Keywords')

    def to_body_dict(self):
        body_dict = super(Project, self).to_body_dict()
        body_dict['_related'] = {}
        for attrname, field in six.iteritems(self._meta._related_fields):
            body_dict['_related'][attrname] = field.rel_cls.model_name

        for attrname in self._meta._reverse_fields:
            field = getattr(self, attrname)
            body_dict['_related'][attrname] = field.related_obj_name

        return body_dict

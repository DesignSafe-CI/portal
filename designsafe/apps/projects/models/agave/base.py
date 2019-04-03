"""Base"""
import logging
import six
import json
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
    guest_members = fields.ListField('Guest Members')
    co_pis = fields.ListField('Co PIs')
    project_type = fields.CharField('Project Type', max_length=255, default='other')
    data_type = fields.CharField('Data Type', max_length=255)
    team_order = fields.ListField('Team Order')
    project_id = fields.CharField('Project Id')
    description = fields.CharField('Description', max_length=1024, default='')
    title = fields.CharField('Title', max_length=255, default='')
    pi = fields.CharField('PI', max_length=255)
    award_number = fields.ListField('Award Number')
    associated_projects = fields.ListField('Associated Project')
    ef = fields.CharField('Experimental Facility', max_length=512)
    keywords = fields.CharField('Keywords')

    @property
    def system(self):
        return 'project-{uuid}'.format(uuid=self.uuid)

    @property
    def collaborators(self):
        return {
            'pi': self.pi,
            'coPis': self.co_pis,
            'teamMembers': self.team_members
        }

    def to_body_dict(self):
        body_dict = super(Project, self).to_body_dict()
        body_dict['_related'] = {}
        for attrname, field in six.iteritems(self._meta._related_fields):
            body_dict['_related'][attrname] = field.rel_cls.model_name

        for attrname in self._meta._reverse_fields:
            field = getattr(self, attrname)
            body_dict['_related'][attrname] = field.related_obj_name

        return body_dict

    def add_pi(self, username):
        self._add_team_members_pems([username])
        if len(self.pi) > 0:
            self.team_members += [self.pi]
            self.team_members = list(set(self.team_members))
        self.pi = username
        self.save(self.manager().agave_client)
        return self

    def remove_pi(self, username):
        self._remove_team_members_pems([username])
        if len(self.co_pis):
            self.pi = self.co_pis[0]
        elif len(self.team_members):
            self.pi = self.team_members[0]
        self.save(self.manager().agave_client)
        return self

    def add_co_pis(self, usernames):
        self._add_team_members_pems(usernames)
        self.co_pis += usernames
        self.co_pis = list(set(self.co_pis))
        self.save(self.manager().agave_client)
        return self

    def remove_co_pis(self, usernames):
        self._remove_team_members_pems(usernames)
        self.co_pis = [co_pi for co_pi in self.co_pis if co_pi not in usernames]
        self.save(self.manager().agave_client)
        return self

    def add_team_members(self, usernames):
        self._add_team_members_pems(usernames)
        self.team_members += usernames
        self.team_members = list(set(self.team_members))
        self.save(self.manager().agave_client)
        return self

    def remove_team_members(self, usernames):
        self._remove_team_members_pems(usernames)
        self.team_members = [member for member in self.team_members if member not in usernames]
        self.save(self.manager().agave_client)
        return self

    def _add_team_members_pems(self, usernames):
        agave_client = self.manager().agave_client
        for username in usernames:
            self.set_pem(username, 'ALL')
            agave_client.systems.updateRole(
                systemId=self.system,
                body={'username': username, 'role': 'USER'})
        return self

    def _remove_team_members_pems(self, usernames):
        agave_client = self.manager().agave_client
        for username in usernames:
            self.set_pem(username, 'NONE')
            agave_client.systems.updateRole(
                systemId=self.system,
                body={'username': username, 'role': 'NONE'})
        return self

    def add_admin(self, username):
        self.set_pem(username, 'ALL')
        self.manager().agave_client.systems.updateRole(
            systemId=self.system,
            body={'username': username, 'role': 'USER'})

    def save(self, ag):
        if self.uuid:
            prj = self.manager().get(ag, self.uuid)
            if prj.project_id and prj.project_id != 'None':
                self.project_id = prj.project_id
        super(Project, self).save(ag)

    def related_entities(self, offset=0, limit=100):
        from designsafe.apps.projects.models.utils import lookup_model
        relattrs = self._meta._reverse_fields
        rel_names = [getattr(self, attrname).related_obj_name for attrname in relattrs \
                         if getattr(self, attrname).related_obj_name != 'designsafe.file']
        resp = self.manager().agave_client.meta.listMetadata(
            q=json.dumps({'name': {'$in': rel_names}, 'associationIds': self.uuid}),
            offset=offset,
            limit=limit)
        ents = [lookup_model(rsp)(**rsp) for rsp in resp]
        return ents

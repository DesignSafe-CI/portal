"""Base"""
import datetime
import logging
import six
import json
import zipfile
import os
from django.contrib.auth import get_user_model
from django.core.exceptions import ObjectDoesNotExist
from pytas.http import TASClient
from designsafe.apps.data.models.agave.base import Model as MetadataModel
from designsafe.apps.data.models.agave import fields


logger = logging.getLogger(__name__)


class RelatedEntity(MetadataModel):
    """Model for entities related to projects."""

    def to_body_dict(self):
        """Serialize to Agave's REST API payload JSON."""
        body_dict = super(RelatedEntity, self).to_body_dict()
        body_dict['_relatedFields'] = []
        for attrname, field in six.iteritems(self._meta._related_fields):
            body_dict['_relatedFields'].append(attrname)
        return body_dict

    def to_datacite_json(self):
        """Serialize object to datacite JSON.

        Every entity subclassing this class should add a `attributes['resourceType']`
        e.g. ``attributes['resourceType'] = Experiment/{}.format(experiment.experiment_type``
        as well as any specific subjects.
        """
        attributes = {}
        authors = [author for author in getattr(self, 'authors', [])
                   if author.get('authorship', False)]
        authors = sorted(authors, key=lambda x: x['order'])
        creators_details, institutions = _process_authors(authors)
        attributes['creators'] = creators_details
        attributes['contributors'] = [
            {
                'contributorType': 'HostingInstitution',
                'contributorName': institution,
            } for institution in institutions
        ]
        attributes['titles'] = [
            {'title': self.title}
        ]
        attributes['publisher'] = 'Designsafe-CI'
        utc_now = datetime.datetime.utcnow()
        attributes['publicationYear'] = utc_now.year
        attributes['resourceTypeGeneral'] = 'Dataset'
        attributes['descriptions'] = [
            {
                'descriptionType': 'Abstract',
                'description': self.description,
                'lang': 'en-Us',
            }
        ]
        attributes['language'] = 'English'
        entities = []
        for attrname in self._meta._reverse_fields:
            field = getattr(self, attrname, False)
            if not field:
                continue
            entities += field(self._meta.agave_client)
        attributes['subjects'] = [
            {'subject': entity.title} for entity in entities
        ]
        return attributes

class Project(MetadataModel):
    model_name = 'designsafe.project'
    team_members = fields.ListField('Team Members')
    guest_members = fields.ListField('Guest Members')
    co_pis = fields.ListField('Co PIs')
    project_type = fields.CharField('Project Type', max_length=255, default=None)
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
    file_tags = fields.ListField('File Tags')

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
        # this may be where we are always adding the PI
        # if len(self.pi) > 0:
        #     self.team_members += [self.pi]
        #     self.team_members = list(set(self.team_members))
        self.pi = username
        self.save(self.manager().agave_client)
        return self

    def remove_pi(self, username):
        self._remove_team_members_pems([username])
        if len(self.co_pis):
            self.pi = self.co_pis[0]
        # elif len(self.team_members):
        #     self.pi = self.team_members[0]
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

    def archive(self):
        ARCHIVE_NAME = str(self.project_id) + '_archive.zip'
        proj_dir = '/corral-repl/tacc/NHERI/projects/{}'.format(self.uuid)

        def create_archive(project_directory):
            try:
                logger.debug("Creating new archive for %s" % project_directory)

                # create archive within the project directory
                archive_path = os.path.join(project_directory, ARCHIVE_NAME)
                abs_path = project_directory.rsplit('/',1)[0]

                

                zf = zipfile.ZipFile(archive_path, mode='w', allowZip64=True)
                for dirs, _, files in os.walk(project_directory):
                    for f in files:
                        if f == ARCHIVE_NAME:
                            continue
                        # write files without abs file path
                        zf.write(os.path.join(dirs, f), os.path.join(dirs.replace(abs_path,''), f))
                zf.close()
            except:
                logger.debug("Creating archive failed for " % 
                    project_directory)

        def update_archive(project_directory):
            try:
                logger.debug("Updating archive for %s" % project_directory)

                archive_path = os.path.join(project_directory, ARCHIVE_NAME)
                archive_timestamp = os.path.getmtime(archive_path)
                zf = zipfile.ZipFile(archive_path, mode='a', allowZip64=True)
                for dirs, _, files in os.walk(project_directory):
                    for f in files:
                        if f == ARCHIVE_NAME:
                            continue
                        file_path = os.path.join(dirs, f)
                        file_timestamp = os.path.getmtime(file_path)
                        if file_timestamp > archive_timestamp:
                            if file_path in zf.namelist():
                                zf.close()
                                logger.debug(
                                    "Modified file, deleting archive and " \
                                    "re-archiving project directory %s" % 
                                    project_directory)
                                os.remove(archive_path)
                                create_archive(project_directory)
                                break
            except:
                logger.debug("Updating archive failed for project directory" % 
                    project_directory)
        
        if ARCHIVE_NAME not in os.listdir(proj_dir):
            create_archive(proj_dir)
        else:
            update_archive(proj_dir)

    def to_datacite_json(self):
        """Serialize project to datacite json."""
        attributes = {}
        if getattr(self, 'team_order', False):
            authors = sorted(self.team_order, key=lambda x: x['order'])
        else:
            authors = [{'name': username} for username in [self.pi] + self.co_pis]
        creators_details, institutions = _process_authors(authors)
        attributes['creators'] = creators_details
        attributes['contributors'] = [
            {
                'contributorType': 'HostingInstitution',
                'contributorName': institution,
            } for institution in institutions
        ]
        attributes['titles'] = [
            {'title': self.title}
        ]
        attributes['publisher'] = 'Designsafe-CI'
        utc_now = datetime.datetime.utcnow()
        attributes['publicationYear'] = utc_now.year
        attributes['resourceType'] = 'Project/{}'.format(
            self.project_type.title().replace('_', ' ')
        )

        if getattr(self, 'data_type', False):
            attributes['resourceType'] += '/{}'.format(self.data_type)

        attributes['resourceTypeGeneral'] = 'Dataset'
        attributes['descriptions'] = [
            {
                'descriptionType': 'Abstract',
                'description': self.description,
                'lang': 'en-Us',
            }
        ]
        attributes['subjects'] = [
            {'subject': keyword} for keyword in self.keywords.split(',')
        ]
        attributes['dates'] = [{
            'dateType': 'Accepted',
            'date': '{}-{}-{}'.format(
                utc_now.year,
                utc_now.month,
                utc_now.day
            )
        }]
        attributes['language'] = 'English'
        attributes['alternateIdentifiers'] = [
            {
                'alternateIdentifierType': 'Project ID',
                'alternateIdentifier': self.project_id,
            }
        ]
        awards = sorted(
            self.award_number,
            key=lambda x: (x.get('order', 0), x.get('name', ''))
        )
        attributes['alternateIdentifiers'] += [
            {
                'alternateIdentifierType': 'NSF Award Number',
                'alternateIdentifier': '{name} - {number}'.format(
                    name=award['name'],
                    number=award['number']
                ),
            } for award in awards
            if award.get('name') and award.get('number')
        ]
        return attributes


def _process_authors(authors):
    """Process authors.

    This function transforms the author's details into
    an list of first name and last name and a list
    of unique institutions. This is necessary to create
    the JSON payload for the Datacite API.

    .. warning:: Authors should be sorted when passed to this
        function.

    :param list[dict] authors: List of dict with author's details.
        Each dictionary must have at least a ``'name'`` key with
        the author's username.
    """
    creators_details = []
    institutions = []
    for author in authors:
        user_obj = None
        user_tas = None
        if not author.get('guest'):
            try:
                user_obj = get_user_model().objects.get(username=author['name'])
            except ObjectDoesNotExist:
                pass

        if user_obj:
            user_tas = TASClient().get_user(username=user_obj.username)

        if user_obj and user_tas:
            creators_details.append({
                'nameType': 'Personal',
                'givenName': user_obj.first_name,
                'familyName': user_obj.last_name,
            })
            institutions.append(user_tas['institution'])
        elif author.get('fname') and author.get('lname'):
            creators_details.append({
                'nameType': 'Personal',
                'givenName': author['fname'],
                'familyName': author['lname'],
            })
            institutions.append(author['inst'])
    institutions = set(institutions)
    return creators_details, institutions

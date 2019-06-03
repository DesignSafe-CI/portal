"""Base"""
import logging
import six
import json
import zipfile
import shutil
import os
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
        proj_dir = '/corral-repl/tacc/NHERI/published/{}'.format(self.project_id)

        # open directory permissions
        def open_perms(project_directory):
            os.chmod('/corral-repl/tacc/NHERI/published/', 0777)
            archive_path = os.path.join(project_directory)
            for root, dirs, files in os.walk(archive_path):
                os.chmod(root, 0777)
                for d in dirs:
                    os.chmod(os.path.join(root, d), 0777)
                for f in files:
                    os.chmod(os.path.join(root, f), 0777)

        # close directory permissions
        def close_perms(project_directory):
            os.chmod('/corral-repl/tacc/NHERI/published/', 0555)
            archive_path = os.path.join(project_directory)
            for root, dirs, files in os.walk(archive_path):
                os.chmod(root, 0555)
                for d in dirs:
                    os.chmod(os.path.join(root, d), 0555)
                for f in files:
                    os.chmod(os.path.join(root, f), 0555)

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
        
        open_perms(proj_dir)
        if ARCHIVE_NAME not in os.listdir(proj_dir):
            create_archive(proj_dir)
        else:
            update_archive(proj_dir)
        close_perms(proj_dir)

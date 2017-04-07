from django.core.urlresolvers import reverse
from django.conf import settings
from django.http.response import HttpResponseForbidden
from django.http import JsonResponse, HttpResponseBadRequest
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from designsafe.apps.api import tasks
from designsafe.apps.api.views import BaseApiView
from designsafe.apps.api.mixins import SecureMixin
from designsafe.apps.api.projects.models import Project
from designsafe.apps.api.agave import get_service_account_client
from designsafe.apps.api.agave.models.metadata import BaseMetadataPermissionResource
from designsafe.apps.api.agave.models.files import BaseFileResource
from designsafe.apps.api.agave.models.util import AgaveJSONEncoder
from designsafe.apps.accounts.models import DesignSafeProfile
from requests.exceptions import HTTPError
from designsafe.apps.api.projects.models import (ExperimentalProject, FileModel,
                                                 Experiment, ModelConfiguration,
                                                 Event, Analysis, SensorList)
import logging
import json

logger = logging.getLogger(__name__)
metrics = logging.getLogger('metrics')


def template_project_storage_system(project):
    system_template = settings.PROJECT_STORAGE_SYSTEM_TEMPLATE.copy()
    system_template['id'] = system_template['id'].format(project.uuid)
    system_template['name'] = system_template['name'].format(project.uuid)
    system_template['description'] = system_template['description'].format(project.title)
    system_template['storage']['rootDir'] = \
        system_template['storage']['rootDir'].format(project.uuid)
    return system_template

class ProjectListingView(SecureMixin, BaseApiView):
    def get(self, request, username):
        """Returns a list of Project for a specific user.

        If the requesting user is a super user then we can 'impersonate'
        another user. Else this is an unauthorized request.

        """
        if not request.user.is_superuser:
            return HttpResponseForbidden()

        user = get_user_model().objects.get(username=username)
        ag = user.agave_oauth.client
        q = request.GET.get('q', None)
        if not q:
            projects = Project.list_projects(agave_client=ag)
        else:
            projects = Project.search(q=q, agave_client=ag)
        return JsonResponse({'projects': projects}, encoder=AgaveJSONEncoder)

class ProjectCollectionView(SecureMixin, BaseApiView):

    def get(self, request):
        """
        Returns a list of Projects for the current user.
        :param request:
        :return: A list of Projects to which the current user has access
        :rtype: JsonResponse
        """
        #raise HTTPError('Custom Error')
        ag = request.user.agave_oauth.client
        projects = Project.list_projects(agave_client=ag)
        data = {'projects': projects}
        return JsonResponse(data, encoder=AgaveJSONEncoder)

    def post(self, request):
        """
        Create a new Project. Projects and the root File directory for a Project should
        be owned by the portal, with roles/permissions granted to the creating user.

        1. Create the metadata record for the project
        2. Create a directory on the projects storage system named after the metadata uuid
        3. Associate the metadata uuid and file uuid

        :param request:
        :return: The newly created project
        :rtype: JsonResponse
        """

        # portal service account needs to create the objects on behalf of the user
        ag = get_service_account_client()

        if request.is_ajax():
            post_data = json.loads(request.body)
        else:
            post_data = request.POST.copy()

        # create Project (metadata)
        metrics.info('projects',
                     extra={'user' : request.user.username,
                            'sessionId': getattr(request.session, 'session_key', ''),
                            'operation': 'metadata_create',
                            'info': {'postData': post_data}})
        p = Project(ag)
        p.save()
        project_uuid = p.uuid
        title = post_data.get('title')
        award_number = post_data.get('awardNumber', '')
        project_type = post_data.get('projectType', 'other')
        associated_projects = post_data.get('associatedProjects', {})
        description = post_data.get('description', '')
        new_pi = post_data.get('pi')
        p.update(title=title,
                 award_number=award_number,
                 project_type=project_type,
                 associated_projects=associated_projects,
                 description=description)
        p.pi = new_pi
        p.save()

        # create Project Directory on Managed system
        metrics.info('projects',
                     extra={'user' : request.user.username,
                            'sessionId': getattr(request.session, 'session_key', ''),
                            'operation': 'base_directory_create',
                            'info': {
                                'systemId': Project.STORAGE_SYSTEM_ID,
                                'uuid': p.uuid
                            }})
        project_storage_root = BaseFileResource(ag, Project.STORAGE_SYSTEM_ID, '/')
        project_storage_root.mkdir(p.uuid)

        # Wrap Project Directory as private system for project
        project_system_tmpl = template_project_storage_system(p)
        project_system_tmpl['storage']['rootDir'] = \
            project_system_tmpl['storage']['rootDir'].format(project_uuid)
        metrics.info('projects',
                     extra={'user' : request.user.username,
                            'sessionId': getattr(request.session, 'session_key', ''),
                            'operation': 'private_system_create',
                            'info': {
                                'id': project_system_tmpl.get('id'),
                                'site': project_system_tmpl.get('site'),
                                'default': project_system_tmpl.get('default'),
                                'status': project_system_tmpl.get('status'),
                                'description': project_system_tmpl.get('description'),
                                'name': project_system_tmpl.get('name'),
                                'globalDefault': project_system_tmpl.get('globalDefault'),
                                'available': project_system_tmpl.get('available'),
                                'public': project_system_tmpl.get('public'),
                                'type': project_system_tmpl.get('type'),
                                'storage': {
                                    'homeDir': project_system_tmpl.get('storage', {}).get('homeDir'),
                                    'rootDir': project_system_tmpl.get('storage', {}).get('rootDir')
                                }
                             }})
        ag.systems.add(body=project_system_tmpl)

        # grant initial permissions for creating user and PI, if exists
        project_system_tmpl = template_project_storage_system(p)
        metrics.info('projects',
                     extra={'user' : request.user.username,
                            'sessionId': getattr(request.session, 'session_key', ''),
                            'operation': 'initial_pems_create',
                            'info': {'collab': request.user.username, 'pi': p.pi} })
        p.add_collaborator(request.user.username)
        if p.pi and p.pi != request.user.username:
            p.add_collaborator(p.pi)
            collab_users = get_user_model().objects.filter(username=p.pi)
            if collab_users:
                collab_user = collab_users[0]
                try:
                    collab_user.profile.send_mail(
                        "[Designsafe-CI] You have been added to a project!",
                        "<p>You have been added to the project <em> {title} </em> as PI</p><p>You can visit the project using this url <a href=\"{url}\">{url}</a>".format(title=p.title, 
                        url=request.build_absolute_uri(reverse('designsafe_data:data_depot') + '/projects/%s/' % (p.uuid,))))
                except DesignSafeProfile.DoesNotExist as err:
                    logger.info("Could not send email to user %s", collab_user)
                    body = "<p>You have been added to the project <em> {title} </em> as PI</p><p>You can visit the project using this url <a href=\"{url}\">{url}</a>".format(title=p.title, 
                        url=request.build_absolute_uri(reverse('designsafe_data:data_depot') + '/projects/%s/' % (p.uuid,)))
                    send_mail(
                        "[Designsafe-CI] You have been added to a project!",
                        body,
                        settings.DEFAULT_FROM_EMAIL,
                        [collab_user.email],
                        html_message=body)
                    #logger.exception(err)

        return JsonResponse(p, encoder=AgaveJSONEncoder, safe=False)

class ProjectMetaLookupMixin(object):
    def _lookup_model(self, name):
        if name == 'designsafe.project':
            return ExperimentalProject
        elif name == 'designsafe.project.experiment':
            return Experiment
        elif name == 'designsafe.project.event':
            return Event
        elif name == 'designsafe.project.analysis':
            return Analysis
        elif name == 'designsafe.project.sensor_list':
            return SensorList
        elif name == 'designsafe.project.model_config':
            return ModelConfiguration
        else:
            raise ValueError('No module found with that name.')

class ProjectInstanceView(SecureMixin, BaseApiView, ProjectMetaLookupMixin):

    def get(self, request, project_id):
        """

        :return:
        :rtype: JsonResponse
        """
        ag = request.user.agave_oauth.client
        #project = Project.from_uuid(agave_client=ag, uuid=project_id)
        meta_obj = ag.meta.getMetadata(uuid=project_id)
        model_cls = self._lookup_model(meta_obj['name'])
        project = model_cls(**meta_obj)
        return JsonResponse(project.to_body_dict(), safe=False)

    def post(self, request, project_id):
        """

        :param request:
        :return:
        """
        ag = get_service_account_client()

        if request.is_ajax():
            post_data = json.loads(request.body)
        else:
            post_data = request.POST.copy()

        # save Project (metadata)
        p = Project.from_uuid(ag, project_id)
        title = post_data.get('title')
        award_number = post_data.get('awardNumber', '')
        project_type = post_data.get('projectType', 'other')
        associated_projects = post_data.get('associatedProjects', {})
        description = post_data.get('description', '')
        team_members = post_data.get('teamMembers', [])
        new_pi = post_data.get('pi')
        if p.pi != new_pi:
            p.pi = new_pi
            p.add_collaborator(new_pi)
        p.update(title=title,
                 award_number=award_number,
                 project_type=project_type,
                 associated_projects=associated_projects,
                 description=description, 
                 team_members=team_members)
        p.save()
        return JsonResponse(p, encoder=AgaveJSONEncoder, safe=False)


class ProjectCollaboratorsView(SecureMixin, BaseApiView):

    def get(self, request, project_id):
        ag = request.user.agave_oauth.client
        project = Project.from_uuid(agave_client=ag, uuid=project_id)
        return JsonResponse(project.team_members())
        #return JsonResponse(project.collaborators, encoder=AgaveJSONEncoder, safe=False)

    def post(self, request, project_id):
        if request.is_ajax():
            post_data = json.loads(request.body)
        else:
            post_data = request.POST.copy()

        ag = get_service_account_client()
        project = Project.from_uuid(agave_client=ag, uuid=project_id)

        username = post_data.get('username')
        member_type = post_data.get('memberType', 'teamMember')
        project.add_collaborator(username)
        collab_users = get_user_model().objects.filter(username=username)
        if collab_users:
            collab_user = collab_users[0]
            try:
                collab_user.profile.send_mail(
                    "[Designsafe-CI] You have been added to a project!",
                    "<p>You have been added to the project <em> {title} </em> as PI</p><p>You can visit the project using this url <a href=\"{url}\">{url}</a>".format(title=project.title, 
                    url=request.build_absolute_uri(reverse('designsafe_data:data_depot') + '/projects/%s/' % (project.uuid,))))
            except DesignSafeProfile.DoesNotExist as err:
                logger.info("Could not send email to user %s", collab_user)
                body = "<p>You have been added to the project <em> {title} </em> as PI</p><p>You can visit the project using this url <a href=\"{url}\">{url}</a>".format(title=project.title, 
                    url=request.build_absolute_uri(reverse('designsafe_data:data_depot') + '/projects/%s/' % (project.uuid,)))
                send_mail(
                    "[Designsafe-CI] You have been added to a project!",
                    body,
                    settings.DEFAULT_FROM_EMAIL,
                    [collab_user.email],
                    html_message=body)
                #logger.exception(err)

        members_list = project.value.get(member_type, [])
        members_list.append(username)
        _kwargs = {member_type: members_list}
        project.update(**_kwargs)
        project.save()
        tasks.check_project_files_meta_pems.apply_async(args=[project.uuid ], queue='api')
        return JsonResponse({'status': 'ok'})

    def delete(self, request, project_id):
        if request.is_ajax():
            post_data = json.loads(request.body)
        else:
            post_data = request.POST.copy()

        ag = get_service_account_client()
        project = Project.from_uuid(agave_client=ag, uuid=project_id)

        project.remove_collaborator(post_data.get('username'))
        tasks.check_project_files_meta_pems.apply_async(args=[project.uuid], queue='api')
        return JsonResponse({'status': 'ok'})


class ProjectDataView(SecureMixin, BaseApiView):

    def get(self, request, project_id, file_path=''):
        """

        :return: The root directory for the Project's data
        :rtype: JsonResponse
        """
        ag = request.user.agave_oauth.client
        p = Project(ag, uuid=project_id)
        list_path = '/'.join([project_id, file_path])
        listing = BaseFileResource.listing(ag, p.project_system_id, list_path)

        return JsonResponse(listing, encoder=AgaveJSONEncoder, safe=False)

class ProjectMetaView(BaseApiView, SecureMixin, ProjectMetaLookupMixin):

    def get(self, request, project_id=None, name=None, uuid=None):
        """

        :return:
        :rtype: JsonResponse
        """
        ag = request.user.agave_oauth.client
        try:
            if name is not None:
                model = self._lookup_model(name)
                resp = model._meta.model_manager.list(ag, project_id)
                return JsonResponse([r.to_body_dict() for r in resp], safe=False)
            elif uuid is not None:
                meta = ag.meta.getMetadata(uuid=uuid)
                model = self._lookup_model(meta['name'])
                resp = model(**meta)
                return JsonResponse(resp.to_body_dict(), safe=False)
        except ValueError:
            return HttpResponseBadRequest('Entity not valid.')

    def delete(self, request, uuid):
        """

        :return:
        :rtype: JsonResponse
        """
        ag = get_service_account_client()
        ag.meta.deleteMetadata(uuid=uuid)
        return JsonResponse({'message':'OK'}, safe=False)

    def post(self, request, project_id, name):
        """

        :param request:
        :return:
        """
        ag = get_service_account_client()

        if request.is_ajax():
            post_data = json.loads(request.body)
        else:
            post_data = request.POST.copy()
        entity = post_data.get('entity')
        try:
            model_cls = self._lookup_model(name)
            logger.debug('entity: %s', entity)
            model = model_cls(value=entity)
            logger.debug('model uuid: %s', model.uuid)
            file_uuids = []
            if 'filePaths' in entity:
                file_paths = entity.get('filePaths', [])
                project_system = ''.join(['project-', project_id])
                user_ag = request.user.agave_oauth.client
                for file_path in file_paths:
                    file_obj = BaseFileResource.listing(user_ag, 
                                                        project_system,
                                                        file_path)

                    file_uuids.append(file_obj.uuid)
                for file_uuid in file_uuids:
                    model.files.add(file_uuid)
                model.associate(file_uuids)
            model.project.add(project_id)
            model.associate(project_id)
            saved = model.save(ag)
            resp = model_cls(**saved)
            #TODO: This should happen in a celery task and implemented in a manager
            #Get project's metadata permissions
            pems = BaseMetadataPermissionResource.list_permissions(project_id, ag)
            #Loop permissions and set them in whatever metadata object we're saving
            for pem in pems:
                _pem = BaseMetadataPermissionResource(resp.uuid, ag)
                _pem.username = pem.username
                _pem.read = pem.read
                _pem.write = pem.write
                _pem.save()

        except ValueError:
            return HttpResponseBadRequest('Entity not valid.')

        return JsonResponse(resp.to_body_dict(), safe=False)

    def put(self, request, uuid):
        """

        :param request:
        :return:
        """
        ag = get_service_account_client()

        if request.is_ajax():
            post_data = json.loads(request.body)
        else:
            post_data = request.POST.copy()
        try:
            entity = post_data.get('entity')
            model_cls = self._lookup_model(entity['name'])
            model = model_cls(**entity)
            saved = model.save(ag)
            resp = model_cls(**saved)
        except ValueError:
            return HttpResponseBadRequest('Entity not valid.')

        return JsonResponse(resp.to_body_dict(), safe=False)

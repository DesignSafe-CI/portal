"""Views"""
import copy
import logging
import json
from django.core.urlresolvers import reverse
from django.conf import settings
from django.http.response import HttpResponseForbidden
from django.http import JsonResponse, HttpResponseBadRequest
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.utils.decorators import method_decorator
from django.contrib.auth.decorators import login_required
from designsafe.apps.api.decorators import agave_jwt_login
from designsafe.apps.api import tasks
from designsafe.apps.api.views import BaseApiView
from designsafe.apps.api.mixins import SecureMixin
from designsafe.apps.api.exceptions import ApiException
from designsafe.apps.api.projects.models import Project
from designsafe.apps.projects.models.agave.base import Project as BaseProject
from designsafe.apps.api.agave import get_service_account_client
from designsafe.apps.data.models.agave.metadata import BaseMetadataPermissionResource
from designsafe.apps.data.models.agave.files import BaseFileResource
from designsafe.apps.data.models.agave.util import AgaveJSONEncoder
from designsafe.apps.accounts.models import DesignSafeProfile
from designsafe.apps.projects.models.utils import lookup_model as project_lookup_model
from designsafe.libs.common.decorators import profile as profile_fn
#from requests.exceptions import HTTPError
from designsafe.apps.projects.models.agave.experimental import (
    ExperimentalProject, Experiment, ModelConfig,
    Event, Analysis, SensorList, Report)
from designsafe.apps.projects.models.agave import simulation, hybrid_simulation
from designsafe.apps.api.agave.filemanager.public_search_index import (PublicationManager,
                                                                       Publication)
logger = logging.getLogger(__name__)
metrics = logging.getLogger('metrics.{name}'.format(name=__name__))


def template_project_storage_system(project):
    system_template = copy.deepcopy(settings.PROJECT_STORAGE_SYSTEM_TEMPLATE)
    system_template['id'] = system_template['id'].format(project.uuid)
    system_template['name'] = system_template['name'].format(project.uuid)
    system_template['description'] = system_template['description'].format(project.title)
    system_template['storage']['rootDir'] = \
        system_template['storage']['rootDir'].format(project.uuid)
    return system_template

class PublicationView(BaseApiView):
    @profile_fn
    def get(self, request, project_id):
        pub = Publication(project_id=project_id)
        if pub is not None and hasattr(pub, 'project'):
            return JsonResponse(pub.to_dict())
        else:
            return JsonResponse({'status': 404,
                                 'message': 'Not found'},
                                 status=404)

    @method_decorator(agave_jwt_login)
    @method_decorator(login_required)
    def post(self, request, **kwargs):
        if request.is_ajax():
            data = json.loads(request.body)

        else:
            data = request.POST

        #logger.debug('publication: %s', json.dumps(data, indent=2))
        status = data.get('status', 'saved')
        pub = PublicationManager().save_publication(
            data['publication'], status)
        if data.get('status', 'save').startswith('publish'):
            tasks.save_publication.apply_async(
                args=[pub.projectId],
                queue='files',
                countdown=60)
        return JsonResponse({'status': 200,
                             'response': {
                                 'message': 'Your publication has been '
                                            'schedule for publication',
                                 'status': status}},
                            status=200)

class ProjectListingView(SecureMixin, BaseApiView):
    @profile_fn
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
    @profile_fn
    def get(self, request, file_mgr_name=None, system_id=None, offset=None, limit=None):
        """
        Returns a list of Projects for the current user.
        :param request:
        :return: A list of Projects to which the current user has access
        :rtype: JsonResponse
        """
        #raise HTTPError('Custom Error')
        ag = request.user.agave_oauth.client

        # Add metadata fields to project listings for workspace browser
        if system_id:
            projects = Project.list_projects(agave_client=ag, **{'path': '', 'type': 'dir', 'system': system_id})
            for p in projects:
                p.path = p.uuid
                p.name = p.value['title']
            data = {
                'children': projects,
                'path': 'Projects',
            }
        else:
            offset = request.GET.get('offset', 0)
            limit = request.GET.get('limit', 100)
            projects = Project.list_projects(agave_client=ag, **{'offset':offset, 'limit':limit})
            data = {'projects': projects}
            
        return JsonResponse(data, encoder=AgaveJSONEncoder)

    @profile_fn
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
                            'operation': 'project_create',
                            'info': {'postData': post_data} })
        prj = BaseProject()
        prj.manager().set_client(ag)
        prj.save(ag)
        project_uuid = prj.uuid
        prj.title = post_data.get('title')
        prj.award_number = post_data.get('awardNumber', '')
        prj.project_type = post_data.get('projectType', 'other')
        prj.associated_projects = post_data.get('associatedProjects', {})
        prj.description = post_data.get('description', '')
        prj.pi = post_data.get('pi')
        prj.keywords = post_data.get('keywords', '')
        prj.project_id = post_data.get('projectId', '')
        prj.save(ag)

        # create Project Directory on Managed system
        metrics.info('projects',
                     extra={'user' : request.user.username,
                            'sessionId': getattr(request.session, 'session_key', ''),
                            'operation': 'base_directory_create',
                            'info': {
                                'systemId': Project.STORAGE_SYSTEM_ID,
                                'uuid': prj.uuid
                            }})
        project_storage_root = BaseFileResource(ag, Project.STORAGE_SYSTEM_ID, '/')
        project_storage_root.mkdir(prj.uuid)

        # Wrap Project Directory as private system for project
        project_system_tmpl = template_project_storage_system(prj)
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
        metrics.info('projects',
                     extra={'user' : request.user.username,
                            'sessionId': getattr(request.session, 'session_key', ''),
                            'operation': 'initial_pems_create',
                            'info': {'collab': request.user.username, 'pi': prj.pi} })
        prj.add_team_members([request.user.username])
        tasks.set_facl_project.apply_async(args=[prj.uuid, [request.user.username]], queue='api')
        if prj.pi and prj.pi != request.user.username:
            prj.add_team_members([prj.pi])
            tasks.set_facl_project.apply_async(args=[prj.uuid, [prj.pi]], queue='api')
            collab_users = get_user_model().objects.filter(username=prj.pi)
            if collab_users:
                collab_user = collab_users[0]
                try:
                    collab_user.profile.send_mail(
                        "[Designsafe-CI] You have been added to a project!",
                        "<p>You have been added to the project <em> {title} </em> as PI</p><p>You can visit the project using this url <a href=\"{url}\">{url}</a>".format(title=prj.title,
                        url=request.build_absolute_uri(reverse('designsafe_data:data_depot') + '/projects/%s/' % (prj.uuid,))))
                except DesignSafeProfile.DoesNotExist as err:
                    logger.info("Could not send email to user %s", collab_user)
                    body = "<p>You have been added to the project <em> {title} </em> as PI</p><p>You can visit the project using this url <a href=\"{url}\">{url}</a>".format(title=prj.title,
                        url=request.build_absolute_uri(reverse('designsafe_data:data_depot') + '/projects/%s/' % (prj.uuid,)))
                    send_mail(
                        "[Designsafe-CI] You have been added to a project!",
                        body,
                        settings.DEFAULT_FROM_EMAIL,
                        [collab_user.email],
                        html_message=body)
        prj.add_admin('prjadmin')
        tasks.set_project_id.apply_async(args=[prj.uuid],queue="api")
        return JsonResponse(prj.to_body_dict(), safe=False)

class ProjectMetaLookupMixin(object):
    def _lookup_model(self, name, prj_type=None):
        clss = {
            'designsafe.project': {
                'experimental': ExperimentalProject,
                'simulation': simulation.SimulationProject
            },
            'designsafe.project.experiment': Experiment,
            'designsafe.project.event': Event,
            'designsafe.project.analysis': Analysis,
            'designsafe.project.sensor_list': SensorList,
            'designsafe.project.model_config': ModelConfig,
            'designsafe.project.report': Report,
            'designsafe.project.simulation': simulation.Simulation,
            'designsafe.project.simulation.model': simulation.Model,
            'designsafe.project.simulation.input': simulation.Input,
            'designsafe.project.simulation.output': simulation.Output,
            'designsafe.project.simulation.analysis': simulation.Analysis,
            'designsafe.project.simulation.report': simulation.Report,
            'designsafe.project.hybrid_simulation': hybrid_simulation.HybridSimulation,
            'designsafe.project.hybrid_simulation.global_model': hybrid_simulation.GlobalModel,
            'designsafe.project.hybrid_simulation.coordinator': hybrid_simulation.Coordinator,
            'designsafe.project.hybrid_simulation.sim_substructure': hybrid_simulation.SimSubstructure,
            'designsafe.project.hybrid_simulation.exp_substructure': hybrid_simulation.ExpSubstructure,
            'designsafe.project.hybrid_simulation.coordinator_output': hybrid_simulation.CoordinatorOutput,
            'designsafe.project.hybrid_simulation.exp_output': hybrid_simulation.ExpOutput,
            'designsafe.project.hybrid_simulation.sim_output': hybrid_simulation.SimOutput,
            'designsafe.project.hybrid_simulation.analysis': hybrid_simulation.Analysis,
            'designsafe.project.hybrid_simulation.report': hybrid_simulation.Report
        }

        cls = clss.get(name)
        if isinstance(cls, dict):
            cls = cls.get(prj_type)

        if cls is None:
            raise ValueError('No module found with that name.')

        return cls

class ProjectInstanceView(SecureMixin, BaseApiView, ProjectMetaLookupMixin):

    @profile_fn
    def get(self, request, project_id):
        """

        :return:
        :rtype: JsonResponse
        """
        ag = request.user.agave_oauth.client
        #project = Project.from_uuid(agave_client=ag, uuid=project_id)
        meta_obj = ag.meta.getMetadata(uuid=project_id)
        #model_cls = self._lookup_model(meta_obj['name'])
        cls = project_lookup_model(meta_obj)
        project = cls(**meta_obj)
        return JsonResponse(project.to_body_dict(), safe=False)

    @profile_fn
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
        p = BaseProject.manager().get(ag, uuid=project_id)
        p.title = post_data.get('title')
        p.award_number = post_data.get('awardNumber', p.award_number)
        p.project_type = post_data.get('projectType', p.project_type)
        p.associated_projects = post_data.get('associatedProjects', p.associated_projects)
        p.description = post_data.get('description', p.description)
        p.team_members = post_data.get('teamMembers', p.team_members)
        p.keywords = post_data.get('keywords', p.keywords)
        new_pi = post_data.get('pi')
        p.project_id = post_data.get('projectId', p.project_id)
        if new_pi and  new_pi != 'null' and p.pi != new_pi:
            p.pi = new_pi
            p.add_pi(new_pi)
        p.save(ag)
        return JsonResponse(p.to_body_dict())


class ProjectCollaboratorsView(SecureMixin, BaseApiView):

    @profile_fn
    def get(self, request, project_id):
        ag = request.user.agave_oauth.client
        project = BaseProject.manager().get(ag, uuid=project_id)
        return JsonResponse(project.collaborators)

    @profile_fn
    def post(self, request, project_id):
        if request.is_ajax():
            post_data = json.loads(request.body)
        else:
            post_data = request.POST.copy()

        team_members_to_add = [user['username'] for user in post_data.get('users') \
                                   if user['memberType'] == 'teamMember']
        co_pis_to_add = [user['username'] for user in post_data.get('users') \
                             if user['memberType'] == 'coPi']
        
        ag = get_service_account_client()
        project = BaseProject.manager().get(ag, uuid=project_id)
        project_title = project.title
        project.manager().set_client(ag)
        project.add_team_members(team_members_to_add)
        project.add_co_pis(co_pis_to_add)
        tasks.check_project_files_meta_pems.apply_async(args=[project.uuid ], queue='api')
        tasks.set_facl_project.apply_async(
            args=[
                project_id,
                team_members_to_add + co_pis_to_add
            ],
            queue='api'
        )

        tasks.email_collaborator_added_to_project.apply_async(
            args=[
                project_title,
                team_members_to_add,
                co_pis_to_add
            ]
        )

        return JsonResponse(project.collaborators)

    @profile_fn
    def delete(self, request, project_id):
        if request.is_ajax():
            post_data = json.loads(request.body)
        else:
            post_data = request.POST.copy()

        ag = get_service_account_client()
        project = BaseProject.manager().get(ag, uuid=project_id)
        project.manager().set_client(ag)
        team_members_to_rm = [user['username'] for user in post_data['users'] \
                                  if user['memberType'] == 'teamMember']
        co_pis_to_rm = [user['username'] for user in post_data['users'] \
                            if user['memberType'] == 'coPi']
        project.remove_team_members(team_members_to_rm)
        project.remove_co_pis(co_pis_to_rm)
        tasks.check_project_files_meta_pems.apply_async(args=[project.uuid], queue='api')

        return JsonResponse({'status': 'ok'})


class ProjectDataView(SecureMixin, BaseApiView):

    @profile_fn
    def get(self, request, file_path='', project_id=None, system_id=None, project_system_id=None, file_mgr_name=None):
        """

        :return: The root directory for the Project's data
        :rtype: JsonResponse
        """
        ag = request.user.agave_oauth.client
        if project_system_id is None:
            p = Project(ag, uuid=project_id)
            project_system_id = p.project_system_id
        
        listing = BaseFileResource.listing(ag, project_system_id, file_path)

        return JsonResponse(listing, encoder=AgaveJSONEncoder, safe=False)

class ProjectMetaView(BaseApiView, SecureMixin, ProjectMetaLookupMixin):

    @profile_fn
    def get(self, request, project_id=None, name=None, uuid=None):
        """

        :return:
        :rtype: JsonResponse
        """
        ag = request.user.agave_oauth.client
        try:
            logger.debug('name: %s', name)
            if name is not None and name != 'all':
                model = self._lookup_model(name)
                resp = model._meta.model_manager.list(ag, project_id)
                resp_list = [r.to_body_dict() for r in resp]
                resp_list = sorted(resp_list, key=lambda x: x['created'])
                return JsonResponse(resp_list, safe=False)
            elif name == 'all':
                prj_obj = ag.meta.getMetadata(uuid=project_id)
                prj = project_lookup_model(prj_obj)(**prj_obj)
                prj.manager().set_client(ag)
                resp_list = [ent.to_body_dict() for ent in prj.related_entities()]
                return JsonResponse(resp_list, safe=False)
            elif uuid is not None:
                meta = ag.meta.getMetadata(uuid=uuid)
                model = self._lookup_model(meta['name'])
                resp = model(**meta)
                return JsonResponse(resp.to_body_dict(), safe=False)
        except ValueError:
            return HttpResponseBadRequest('Entity not valid.')

    @profile_fn
    def delete(self, request, uuid):
        """

        :return:
        :rtype: JsonResponse
        """
        ag = get_service_account_client()
        meta_obj = ag.meta.getMetadata(uuid=uuid)
        model = self._lookup_model(meta_obj['name'])
        meta = model(**meta_obj)
        ag.meta.deleteMetadata(uuid=uuid)
        return JsonResponse(meta.to_body_dict(), safe=False)

    @profile_fn
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

    @profile_fn
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

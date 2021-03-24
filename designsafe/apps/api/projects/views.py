"""Views"""
import copy
import logging
import json
from celery import group, chain
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
from designsafe.apps.api.projects.models import Project
from designsafe.apps.projects.models.agave.base import Project as BaseProject
from designsafe.apps.projects.models.categories import Category
from designsafe.apps.api.agave import get_service_account_client, to_camel_case
from designsafe.apps.data.models.agave.metadata import BaseMetadataPermissionResource
from designsafe.apps.data.models.agave.files import BaseFileResource
from designsafe.apps.data.models.agave.util import AgaveJSONEncoder
from designsafe.apps.accounts.models import DesignSafeProfile
from designsafe.apps.projects.models.utils import lookup_model as project_lookup_model
from designsafe.libs.common.decorators import profile as profile_fn
from designsafe.apps.api.publications.operations import save_publication
from designsafe.libs.elasticsearch.docs.publications import BaseESPublication
from designsafe.libs.elasticsearch.docs.publication_legacy import BaseESPublicationLegacy
from designsafe.apps.data.models.elasticsearch import IndexedPublication
from elasticsearch_dsl import Q
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
        pub = BaseESPublication(project_id=project_id)
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

        status = data.get('status', 'saved')
        revision = data.get('revision', None)

        project_id = data['publication']['project']['value']['projectId']

        current_revision = None
        # If revision is truthy, increment the revision count and pass it to the pipeline.
        if revision:
            latest_revision = IndexedPublication.max_revision(project_id=project_id)
            current_revision = latest_revision + 1

        pub = save_publication(data['publication'], status, revision=current_revision)

        if data.get('status', 'save').startswith('publish'):
            (
                tasks.freeze_publication_meta.s(
                    pub.projectId,
                    data.get('mainEntityUuids'),
                    revision=current_revision
                ).set(queue='api') |
                group(
                    tasks.save_publication.si(
                        pub.projectId,
                        data.get('mainEntityUuids'),
                        revision=current_revision
                    ).set(
                        queue='files',
                        countdown=60
                    ),
                    tasks.copy_publication_files_to_corral.si(
                        pub.projectId,
                        revision=current_revision
                    ).set(
                        queue='files',
                        countdown=60
                    )
                ) |
                tasks.swap_file_tag_uuids.si(pub.projectId, revision=current_revision) |
                tasks.set_publish_status.si(
                    pub.projectId,
                    data.get('mainEntityUuids'),
                    revision=current_revision
                ) |
                tasks.zip_publication_files.si(pub.projectId, revision=current_revision) |
                tasks.email_user_publication_request_confirmation.si(request.user.username)
            ).apply_async()

        return JsonResponse({'status': 200,
                             'response': {
                                 'message': 'Your publication has been '
                                            'schedule for publication',
                                 'status': status}},
                            status=200)


class NeesPublicationView(BaseApiView):
    """
    View for retrieving NEES legacy projects.
    """
    @profile_fn
    def get(self, request, nees_id):
        """
        Retrieve a NEES project using its ID and return its JSON representation.
        """
        pub = BaseESPublicationLegacy(nees_id=nees_id)
        return JsonResponse(pub.to_file())


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
    def get(self, request, file_mgr_name=None, system_id=None, offset=0, limit=100):
        """
        Returns a list of Projects for the current user.
        :param request:
        :return: A list of Projects to which the current user has access
        :rtype: JsonResponse
        """
        #raise HTTPError('Custom Error')
        ag = request.user.agave_oauth.client
        query_string = request.GET.get('query_string', None)
        offset = request.GET.get('offset', 0)
        limit = request.GET.get('limit', 100)
        if query_string is not None:
            projects = Project.ES_search(agave_client=ag, query_string=query_string, **{'offset': offset, 'limit': limit})
            data = {'projects': projects}
            return JsonResponse(data, encoder=AgaveJSONEncoder)
        # Add metadata fields to project listings for workspace browser
        if system_id:
            projects = Project.list_projects(agave_client=ag, **{'path': '', 'type': 'dir', 'system': system_id})
            for p in projects:
                p.path = ''
                p.name = p.value['title']
                p.system = 'project-{}'.format(p.uuid)
            data = {
                'children': projects,
                'path': 'Projects',
            }
        else:
            projects = Project.list_projects(agave_client=ag, **{'offset': offset, 'limit': limit})
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
                     extra={'user': request.user.username,
                            'sessionId': getattr(request.session, 'session_key', ''),
                            'operation': 'project_create',
                            'info': {'postData': post_data}})
        prj_model = project_lookup_model({'name': 'designsafe.project', 'value': post_data})
        prj = prj_model(value=post_data)
        project_uuid = prj.uuid
        prj.manager().set_client(ag)
        prj.save(ag)

        # create Project Directory on Managed system
        metrics.info('projects',
                     extra={'user': request.user.username,
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
                     extra={'user': request.user.username,
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
                     extra={'user': request.user.username,
                            'sessionId': getattr(request.session, 'session_key', ''),
                            'operation': 'initial_pems_create',
                            'info': {'collab': request.user.username, 'pi': prj.pi}})

        if getattr(prj, 'copi', None):
            prj.add_co_pis(prj.copi)
        elif getattr(prj, 'co_pis', None):
            prj.add_co_pis(prj.co_pis)
        if getattr(prj, 'team', None):
            prj.add_team_members(prj.team)
        elif getattr(prj, 'team_members', None):
            prj.add_team_members(prj.team_members)

        prj._add_team_members_pems([prj.pi])

        if request.user.username not in list(set(prj.co_pis + prj.team_members + [prj.pi])):
            # Add creator to project as team member
            prj.add_team_members([request.user.username])

        # Email collaborators
        chain(
            tasks.set_project_id.s(prj.uuid).set(queue="api") |
            tasks.email_collaborator_added_to_project.s(
                prj.uuid,
                prj.title,
                request.build_absolute_uri('{}/projects/{}/'.format(reverse('designsafe_data:data_depot'), prj.uuid)),
                [u for u in list(set(prj.co_pis + prj.team_members + [prj.pi])) if u != request.user.username],
                []
            )
        ).apply_async()

        tasks.set_facl_project.apply_async(
            args=[
                prj.uuid,
                list(set(prj.co_pis + prj.team_members + [prj.pi]))
            ],
            queue='api'
        )

        prj.add_admin('prjadmin')
        return JsonResponse(prj.to_body_dict(), safe=False)


class ProjectInstanceView(SecureMixin, BaseApiView):

    @profile_fn
    def get(self, request, project_id):
        """

        :return:
        :rtype: JsonResponse
        """
        ag = request.user.agave_oauth.client
        #project = Project.from_uuid(agave_client=ag, uuid=project_id)
        meta_obj = ag.meta.getMetadata(uuid=project_id)
        cls = project_lookup_model(meta_obj)
        project = cls(**meta_obj)
        project_dict = project.to_body_dict()

        # serialization can change the PI order
        try:
            project_dict['value']['coPis'] = meta_obj['value']['coPis']
        except KeyError:
            pass
        return JsonResponse(project_dict)

    @profile_fn
    def post(self, request, project_id):
        """
        Update a Project. Projects and the root File directory for a Project should
        be owned by the portal, with roles/permissions granted to the creating user.

        1. Get the metadata record for the project
        2. Get the metadata permissions for the project
        3. Update the metadata record with changes from the post data and initilize the
           appropriate project class.
        4. Use the metadata permissions and the metadata record to determine which users
           to add and/or remove from the project
        5. Update file metadata permissions
        6. Set ACLs on the project
        7. Email users who have been added to the project

        :param request: 
        :return:
        """
        if request.is_ajax():
            post_data = json.loads(request.body)
        else:
            post_data = request.POST.copy()

        client = get_service_account_client()
        meta_obj = client.meta.getMetadata(uuid=project_id)
        meta_perms = client.meta.listMetadataPermissions(uuid=project_id)

        # update the meta_obj
        for key, value in post_data.items():
            camel_key = to_camel_case(key)
            meta_obj.value[camel_key] = value

        # get users to add/remove
        admins = ['ds_admin', 'prjadmin']
        users_with_access = [x['username'] for x in meta_perms]
        updated_users = list(set(
            meta_obj['value']['teamMembers'] +
            meta_obj['value']['coPis'] +
            [meta_obj['value']['pi']]
        ))
        add_perm_usrs = [
            u for u in updated_users + admins
            if u not in users_with_access
        ]
        rm_perm_usrs = [
            u for u in users_with_access
            if u not in updated_users + admins
        ]

        prj_class = project_lookup_model(meta_obj)
        project = prj_class(value=meta_obj.value, uuid=project_id)
        project.manager().set_client(client)

        try:
            ds_user = get_user_model().objects.get(username=project.pi)
        except:
            return HttpResponseBadRequest('Project update requires a valid PI')

        # remove permissions for users not on project and add permissions for new members
        if rm_perm_usrs:
            project._remove_team_members_pems(rm_perm_usrs)
        if add_perm_usrs:
            project._add_team_members_pems(add_perm_usrs)

        tasks.check_project_files_meta_pems.apply_async(args=[project.uuid], queue='api')
        tasks.set_facl_project.apply_async(
            args=[
                project.uuid,
                add_perm_usrs
            ],
            queue='api'
        )
        tasks.email_collaborator_added_to_project.apply_async(
            args=[
                project.project_id,
                project.uuid,
                project.title,
                request.build_absolute_uri(
                    '{}/projects/{}/'.format(reverse('designsafe_data:data_depot'), project.uuid)
                ),
                add_perm_usrs,
                []
            ]
        )
        project.save(client)
        return JsonResponse(project.to_body_dict())


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

        team_members_to_add = [user['username'] for user in post_data.get('users')
                               if user['memberType'] == 'teamMember']
        co_pis_to_add = [user['username'] for user in post_data.get('users')
                         if user['memberType'] == 'coPi']

        ag = get_service_account_client()
        project = BaseProject.manager().get(ag, uuid=project_id)
        project.manager().set_client(ag)
        project.add_team_members(team_members_to_add)
        project.add_co_pis(co_pis_to_add)
        tasks.check_project_files_meta_pems.apply_async(args=[project.uuid], queue='api')
        tasks.set_facl_project.apply_async(
            args=[
                project_id,
                team_members_to_add + co_pis_to_add
            ],
            queue='api'
        )

        tasks.email_collaborator_added_to_project.apply_async(
            args=[
                project.project_id,
                project.project_uuid,
                project.title,
                request.build_absolute_uri('{}/projects/{}/'.format(reverse('designsafe_data:data_depot'), project.uuid)),
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
        team_members_to_rm = [user['username'] for user in post_data['users']
                              if user['memberType'] == 'teamMember']
        co_pis_to_rm = [user['username'] for user in post_data['users']
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


class ProjectMetaView(BaseApiView, SecureMixin):

    @profile_fn
    def get(self, request, project_id=None, name=None, uuid=None):
        """

        :return:
        :rtype: JsonResponse
        """
        ag = request.user.agave_oauth.client
        try:
            if name is not None and name != 'all':
                model = project_lookup_model(name=name)
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
                model = project_lookup_model(meta)
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
        model = project_lookup_model(meta_obj)
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
            model_cls = project_lookup_model(name=name)
            model = model_cls(value=entity)
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
            # TODO: This should happen in a celery task and implemented in a manager
            # Get project's metadata permissions
            pems = BaseMetadataPermissionResource.list_permissions(project_id, ag)
            # Loop permissions and set them in whatever metadata object we're saving
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
        entity = post_data.get('entity')
        category = Category.objects.get_or_create_from_json(
            uuid=entity['uuid'],
            dict_obj=entity['_ui']
        )
        try:
            model_cls = project_lookup_model(entity)
            model = model_cls(**entity)
            saved = model.save(ag)
            resp = model_cls(**saved)
        except ValueError:
            return HttpResponseBadRequest('Entity not valid.')

        return JsonResponse(resp.to_body_dict(), safe=False)

class ProjectNotificationView(BaseApiView, SecureMixin):
    @profile_fn
    def post(self, request, project_uuid):
        """
        View for email notifications regarding projects
        """
        post_data = json.loads(request.body)
        username = post_data.get('username')
        ag = get_service_account_client()
        project = BaseProject.manager().get(ag, uuid=project_uuid)
        tasks.email_project_admins.apply_async(
            args=[
                project.project_id,
                project_uuid,
                project.title,
                request.build_absolute_uri('{}/projects/{}/'.format(reverse('designsafe_data:data_depot'), project_uuid)),
                username
            ]
        )
        return JsonResponse({'status': 'ok'})

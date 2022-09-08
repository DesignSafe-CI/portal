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
from designsafe.apps.api.agave import get_service_account_client, service_account, to_camel_case
from designsafe.apps.data.models.agave.metadata import BaseMetadataPermissionResource
from designsafe.apps.data.models.agave.files import BaseFileResource
from designsafe.apps.data.models.agave.util import AgaveJSONEncoder
from designsafe.apps.accounts.models import DesignSafeProfile
from designsafe.apps.projects.models.utils import lookup_model as project_lookup_model
from designsafe.libs.common.decorators import profile as profile_fn
from designsafe.apps.api.publications.operations import initilize_publication
from designsafe.libs.elasticsearch.docs.publications import BaseESPublication
from designsafe.libs.elasticsearch.docs.publication_legacy import BaseESPublicationLegacy
from designsafe.apps.data.models.elasticsearch import IndexedPublication
from designsafe.libs.elasticsearch.utils import new_es_client
from django.views.decorators.csrf import csrf_exempt
from elasticsearch_dsl import Q
from designsafe.apps.api.utils import get_client_ip
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
    def get(self, request, project_id, revision=None):
        """
        Get a publication. If a revision is not supplied, return
        the "Original" publication. Include the latest version if it
        is not being queried.
        """
        es_client = new_es_client()
        pub = BaseESPublication(project_id=project_id, revision=revision, using=es_client)
        latest_revision = IndexedPublication.max_revision(project_id=project_id, using=es_client)
        latest_pub_dict = None
        if latest_revision > 0 and latest_revision != revision:
            latest_pub = BaseESPublication(project_id=project_id, revision=latest_revision, using=es_client)
            if latest_pub is not None and hasattr(latest_pub, 'project'):
                latest_pub_dict = latest_pub.to_dict()

        if pub is not None and hasattr(pub, 'project'):
            pub_dict = pub.to_dict()

            if pub_dict['project']['value']['projectType'] != 'other':
                metrics.info('Data Depot',
                     extra={
                         'user': request.user.username,
                         'sessionId': getattr(request.session, 'session_key', ''),
                         'operation': 'listing',
                         'agent': request.META.get('HTTP_USER_AGENT'),
                         'ip': get_client_ip(request),
                         'info': {
                             'api': 'agave',
                             'systemId': 'designsafe.storage.published',
                             'filePath': project_id,
                             'query': {} }
                     })

            if latest_pub_dict:
                pub_dict['latestRevision'] = latest_pub_dict
            return JsonResponse(pub_dict)
        else:
            return JsonResponse({'status': 404,
                                 'message': 'Not found'},
                                status=404)

    @method_decorator(agave_jwt_login)
    @method_decorator(login_required)
    def post(self, request, **kwargs):
        """
        Publish a project or version a publication
        """
        if request.is_ajax():
            data = json.loads(request.body)
        else:
            data = request.POST

        status = data.get('status', 'saved')
        revision = data.get('revision', None)
        revision_text = data.get('revisionText', None)
        revision_titles = data.get('revisionTitles', None)
        revised_authors = data.get('revisionAuthors', None)
        selected_files = data.get('selectedFiles', None)

        project_id = data['publication']['project']['value']['projectId']

        current_revision = None
        # If revision is truthy, increment the revision count and pass it to the pipeline.
        if revision:
            latest_revision = IndexedPublication.max_revision(project_id=project_id)
            current_revision = latest_revision + 1 if latest_revision >= 2 else 2

        pub = initilize_publication(
                data['publication'],
                status,
                revision=current_revision,
                revision_text=revision_text,
                revision_titles=revision_titles
            )

        if data.get('status', 'save').startswith('publish'):
            (
                tasks.freeze_publication_meta.s(
                    project_id=pub.projectId,
                    entity_uuids=data.get('mainEntityUuids'),
                    revision=current_revision,
                    revised_authors=revised_authors
                ).set(queue='api') |
                group(
                    tasks.save_publication.si(
                        project_id=pub.projectId,
                        entity_uuids=data.get('mainEntityUuids'),
                        revision=current_revision,
                        revised_authors=revised_authors
                    ).set(
                        queue='files',
                        countdown=60
                    ),
                    tasks.copy_publication_files_to_corral.si(
                        project_id=pub.projectId,
                        revision=current_revision,
                        selected_files=selected_files
                    ).set(
                        queue='files',
                        countdown=60
                    )
                ) |
                tasks.swap_file_tag_uuids.si(pub.projectId, revision=current_revision) |
                tasks.set_publish_status.si(
                    project_id=pub.projectId,
                    entity_uuids=data.get('mainEntityUuids'),
                    revision=current_revision
                ) |
                tasks.zip_publication_files.si(pub.projectId, revision=current_revision) |
                tasks.email_user_publication_request_confirmation.si(request.user.username) |
                tasks.check_published_files.si(pub.projectId, revision=current_revision, selected_files=selected_files)
            ).apply_async()

        return JsonResponse({
            'success': 'Project is publishing.'
        }, status=200)

class AmendPublicationView(BaseApiView):
    @method_decorator(agave_jwt_login)
    @method_decorator(login_required)
    def post(self, request, **kwargs):
        """
        Amend a Publication
        """
        if request.is_ajax():
            data = json.loads(request.body)
        else:
            data = request.POST

        project_id = data['projectId']
        authors = data.get('authors', None)
        amendments = data.get('amendments', None)
        current_revision = IndexedPublication.max_revision(project_id=project_id)

        (
            tasks.amend_publication_data.s(
                project_id,
                amendments,
                authors,
                current_revision
            ).set(queue='api') |
            tasks.zip_publication_files.si(
                project_id,
                current_revision
            ).set(queue='files')
        ).apply_async()

        return JsonResponse({
            'success': 'Publication is being amended.'
        }, status=200)


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
        client = user.agave_oauth.client
        q = request.GET.get('q', None)
        if not q:
            projects = Project.list_projects(agave_client=client)
        else:
            projects = Project.search(q=q, agave_client=client)
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
        client = request.user.agave_oauth.client
        query_string = request.GET.get('query_string', None)
        offset = request.GET.get('offset', 0)
        limit = request.GET.get('limit', 100)
        if query_string is not None:
            projects = Project.ES_search(agave_client=client, query_string=query_string, **{'offset': offset, 'limit': limit})
            data = {'projects': projects}
            return JsonResponse(data, encoder=AgaveJSONEncoder)
        # Add metadata fields to project listings for workspace browser
        if system_id:
            projects = Project.list_projects(agave_client=client, **{'path': '', 'type': 'dir', 'system': system_id})
            for p in projects:
                p.path = ''
                p.name = p.value['title']
                p.system = 'project-{}'.format(p.uuid)
            data = {
                'children': projects,
                'path': 'Projects',
            }
        else:
            projects = Project.list_projects(agave_client=client, **{'offset': offset, 'limit': limit})
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
        sa_client = get_service_account_client()

        if request.is_ajax():
            post_data = json.loads(request.body)
        else:
            post_data = request.POST.copy()

        # create Project (metadata)
        metrics.info('projects',
                     extra={'user': request.user.username,
                            'sessionId': getattr(request.session, 'session_key', ''),
                            'operation': 'project_create',
                            'agent': request.META.get('HTTP_USER_AGENT'),
                            'ip': get_client_ip(request),
                            'info': {'postData': post_data}})
        prj_model = project_lookup_model({'name': 'designsafe.project', 'value': post_data})
        prj = prj_model(value=post_data)
        project_uuid = prj.uuid
        prj.manager().set_client(sa_client)
        prj.save(sa_client)

        # create Project Directory on Managed system
        metrics.info('projects',
                     extra={'user': request.user.username,
                            'sessionId': getattr(request.session, 'session_key', ''),
                            'operation': 'base_directory_create',
                            'agent': request.META.get('HTTP_USER_AGENT'),
                            'ip': get_client_ip(request),
                            'info': {
                                'systemId': Project.STORAGE_SYSTEM_ID,
                                'uuid': prj.uuid
                            }})
        project_storage_root = BaseFileResource(sa_client, Project.STORAGE_SYSTEM_ID, '/')
        project_storage_root.mkdir(prj.uuid)

        # Wrap Project Directory as private system for project
        project_system_tmpl = template_project_storage_system(prj)
        project_system_tmpl['storage']['rootDir'] = \
            project_system_tmpl['storage']['rootDir'].format(project_uuid)
        metrics.info('projects',
                     extra={'user': request.user.username,
                            'sessionId': getattr(request.session, 'session_key', ''),
                            'operation': 'private_system_create',
                            'agent': request.META.get('HTTP_USER_AGENT'),
                            'ip': get_client_ip(request),
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
        sa_client.systems.add(body=project_system_tmpl)

        # grant initial permissions for creating user and PI, if exists
        metrics.info('projects',
                     extra={'user': request.user.username,
                            'sessionId': getattr(request.session, 'session_key', ''),
                            'operation': 'initial_pems_create',
                            'agent': request.META.get('HTTP_USER_AGENT'),
                            'ip': get_client_ip(request),
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


@method_decorator(csrf_exempt, name='dispatch')
@method_decorator(agave_jwt_login, name='dispatch')
@method_decorator(profile_fn, name='dispatch')
@method_decorator(login_required, name='dispatch')
class ProjectInstanceView(BaseApiView):

    def get(self, request, project_id):
        """

        :return:
        :rtype: JsonResponse
        """
        client = request.user.agave_oauth.client
        meta_obj = client.meta.getMetadata(uuid=project_id)
        cls = project_lookup_model(meta_obj)
        project = cls(**meta_obj)
        project_dict = project.to_body_dict()

        return JsonResponse(project_dict)

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

        client = request.user.agave_oauth.client
        sa_client = get_service_account_client() # service account for updating user permissions

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
        project.manager().set_client(sa_client)

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


class ProjectDataView(SecureMixin, BaseApiView):

    @profile_fn
    def get(self, request, file_path='', project_id=None, system_id=None, project_system_id=None, file_mgr_name=None):
        """

        :return: The root directory for the Project's data
        :rtype: JsonResponse
        """
        client = request.user.agave_oauth.client
        if project_system_id is None:
            p = Project(client, uuid=project_id)
            project_system_id = p.project_system_id

        listing = BaseFileResource.listing(client, project_system_id, file_path)

        return JsonResponse(listing, encoder=AgaveJSONEncoder, safe=False)


class ProjectMetaView(BaseApiView, SecureMixin):

    @profile_fn
    def get(self, request, project_id=None, name=None, uuid=None):
        """
        Get a project's related metadata or single
        metadata object by uuid.

        :return:
        :rtype: JsonResponse
        """
        client = request.user.agave_oauth.client
        try:
            if name is not None and name != 'all':
                model = project_lookup_model(name=name)
                resp = model._meta.model_manager.list(client, project_id)
                resp_list = [r.to_body_dict() for r in resp]
                resp_list = sorted(resp_list, key=lambda x: x['created'])
                return JsonResponse(resp_list, safe=False)
            elif name == 'all':
                prj_obj = client.meta.getMetadata(uuid=project_id)
                prj = project_lookup_model(prj_obj)(**prj_obj)
                prj.manager().set_client(client)
                resp_list = [ent.to_body_dict() for ent in prj.related_entities()]
                return JsonResponse(resp_list, safe=False)
            elif uuid is not None:
                meta = client.meta.getMetadata(uuid=uuid)
                model = project_lookup_model(meta)
                resp = model(**meta)
                return JsonResponse(resp.to_body_dict(), safe=False)
        except ValueError:
            return HttpResponseBadRequest('Entity not valid.')

    @profile_fn
    def delete(self, request, uuid):
        """
        Delete metadata. This will delete associated metadata objects.
        This should not be used to delete a project (only metadata related
        to a project).

        :return:
        :rtype: JsonResponse
        """
        try:
            client = request.user.agave_oauth.client
            meta_obj = client.meta.getMetadata(uuid=uuid)
            model = project_lookup_model(meta_obj)
            meta = model(**meta_obj)
        except Exception as e:
            logger.exception('Unable to delete project metadata: %s', e)
            logger.exception('Meta UUID: %s', uuid)

        sa_client = get_service_account_client()
        sa_client.meta.deleteMetadata(uuid=uuid)
        return JsonResponse(meta.to_body_dict(), safe=False)

    @profile_fn
    def post(self, request, project_id, name):
        """
        Create project related metadata object.

        :param request:
        :return:
        """
        sa_client = get_service_account_client()

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
                client = request.user.agave_oauth.client
                for file_path in file_paths:
                    file_obj = BaseFileResource.listing(client,
                                                        project_system,
                                                        file_path)

                    file_uuids.append(file_obj.uuid)
                for file_uuid in file_uuids:
                    model.files.add(file_uuid)
                model.associate(file_uuids)
            model.project.add(project_id)
            model.associate(project_id)
            saved = model.save(sa_client)
            resp = model_cls(**saved)
            # TODO: We should stop using these "Resources" and just use agavepy methods.
            pems = BaseMetadataPermissionResource.list_permissions(project_id, sa_client)
            # Loop permissions and set them in whatever metadata object we're saving
            for pem in pems:
                _pem = BaseMetadataPermissionResource(resp.uuid, sa_client)
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
        Update Project Related Metadata
        This should update an existing entity related to a project

        :param request:
        :return:
        """
        client = request.user.agave_oauth.client

        if request.is_ajax():
            post_data = json.loads(request.body)
        else:
            post_data = request.POST.copy()
        entity = post_data.get('entity')

        try:
            model_cls = project_lookup_model(entity)
            model = model_cls(**entity)
            saved = model.save(client)
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
        sa_client = get_service_account_client()
        project = BaseProject.manager().get(sa_client, uuid=project_uuid)
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

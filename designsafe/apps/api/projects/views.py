from django.conf import settings
from django.http import JsonResponse
from designsafe.apps.api import tasks
from designsafe.apps.api.views import BaseApiView
from designsafe.apps.api.mixins import SecureMixin
from designsafe.apps.api.projects.models import Project
from designsafe.apps.api.agave import get_service_account_client
from designsafe.apps.api.agave.models.files import BaseFileResource
from designsafe.apps.api.agave.models.util import AgaveJSONEncoder
import logging
import json

logger = logging.getLogger(__name__)


def template_project_storage_system(project):
    system_template = settings.PROJECT_STORAGE_SYSTEM_TEMPLATE.copy()
    system_template['id'] = system_template['id'].format(project.uuid)
    system_template['name'] = system_template['name'].format(project.title)
    system_template['description'] = system_template['description'].format(project.title)
    system_template['storage']['rootDir'] = \
        system_template['storage']['rootDir'].format(project.uuid)
    return system_template


class ProjectCollectionView(BaseApiView, SecureMixin):

    def get(self, request):
        """
        Returns a list of Projects for the current user.
        :param request:
        :return: A list of Projects to which the current user has access
        :rtype: JsonResponse
        """
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
        p = Project(ag)
        p.title = post_data.get('title')
        p.pi = post_data.get('pi', None)
        p.save()

        # create Project Directory on Managed system
        project_storage_root = BaseFileResource(ag, Project.STORAGE_SYSTEM_ID, '/')
        project_storage_root.mkdir(p.uuid)

        # Wrap Project Directory as private system for project
        project_system_tmpl = template_project_storage_system(p)
        ag.systems.add(body=project_system_tmpl)

        # grant initial permissions for creating user and PI, if exists
        p.add_collaborator(request.user.username)
        if p.pi and p.pi != request.user.username:
            p.add_collaborator(p.pi)

        return JsonResponse(p, encoder=AgaveJSONEncoder, safe=False)


class ProjectInstanceView(BaseApiView, SecureMixin):

    def get(self, request, project_id):
        """

        :return:
        :rtype: JsonResponse
        """
        ag = request.user.agave_oauth.client
        project = Project.from_uuid(agave_client=ag, uuid=project_id)
        return JsonResponse(project, encoder=AgaveJSONEncoder, safe=False)

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
        p.title = post_data.get('title')
        new_pi = post_data.get('pi', None)
        if p.pi != new_pi:
            p.pi = new_pi
            p.add_collaborator(new_pi)
        p.save()
        return JsonResponse(p, encoder=AgaveJSONEncoder, safe=False)


class ProjectCollaboratorsView(BaseApiView, SecureMixin):

    def get(self, request, project_id):
        ag = request.user.agave_oauth.client
        project = Project(agave_client=ag, uuid=project_id)
        return JsonResponse(project.collaborators, encoder=AgaveJSONEncoder, safe=False)

    def post(self, request, project_id):
        if request.is_ajax():
            post_data = json.loads(request.body)
        else:
            post_data = request.POST.copy()

        ag = get_service_account_client()
        project = Project.from_uuid(agave_client=ag, uuid=project_id)

        project.add_collaborator(post_data.get('username'))
        tasks.check_project_files_meta_pems.apply_async(args=[project.uuid ])
        return JsonResponse({'status': 'ok'})

    def delete(self, request, project_id):
        if request.is_ajax():
            post_data = json.loads(request.body)
        else:
            post_data = request.POST.copy()

        ag = get_service_account_client()
        project = Project.from_uuid(agave_client=ag, uuid=project_id)

        project.remove_collaborator(post_data.get('username'))
        tasks.check_project_files_meta_pems(project.uuid)
        return JsonResponse({'status': 'ok'})


class ProjectDataView(BaseApiView, SecureMixin):

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

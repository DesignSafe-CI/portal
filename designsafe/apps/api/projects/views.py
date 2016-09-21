from django.http import JsonResponse
from designsafe.apps.api.views import BaseApiView
from designsafe.apps.api.mixins import SecureMixin
from designsafe.apps.api.exceptions import ApiException
from designsafe.apps.api.projects.models import Project
from designsafe.apps.api.data.agave.file import AgaveFile
from designsafe.apps.api.agave import get_service_account_client
from designsafe.apps.api.agave.models.util import AgaveJSONEncoder
import logging

logger = logging.getLogger(__name__)


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

        # create Project (metadata)
        p = Project(ag)
        p.title = request.POST.get('title')
        p.save()

        # grant creating user permissions
        p.add_collaborator(request.user.username)

        # create the data directory File and grant user permissions
        project_dir = AgaveFile.mkdir(Project.storage_system_id, None, '/', p.uuid, ag)
        project_dir.update_pems(request.user.username, 'ALL', True)

        # relate the Project as metadata for the File
        p.project_directory = project_dir
        p.save()

        return JsonResponse(p, encoder=AgaveJSONEncoder, safe=False)


class ProjectInstanceView(BaseApiView, SecureMixin):

    def get(self, request, project_id):
        """

        :return:
        :rtype: JsonResponse
        """
        ag = request.user.agave_oauth.client
        project = Project(uuid=project_id, agave_client=ag)
        project.fetch()
        return JsonResponse(project, encoder=AgaveJSONEncoder, safe=False)

    def put(self, request):
        """

        :param request:
        :return:
        """
        ag = request.user.agave_oauth.client

        



class ProjectDataView(BaseApiView, SecureMixin):

    def get(self, request, project_id):
        """

        :return: The root directory for the Project's data
        :rtype: JsonResponse
        """
        ag = request.user.agave_oauth.client
        project = Project(uuid=project_id, agave_client=ag)
        project_dir = project.project_directory
        data = project_dir.to_dict()
        data['children'] = [f.to_dict() for f in project.project_data_listing[1:]]
        return JsonResponse(data)

from designsafe.apps.api.agave.models.metadata import (BaseMetadataResource,
                                                       BaseMetadataPermissionResource)
from designsafe.apps.api.data.agave.file import AgaveFile
import json


class Project(BaseMetadataResource):
    """
    A Project represents a data collection with associated metadata. The base object for
    a project is a metadata object of the name (type) `designsafe.project`. Associated
    with this metadata object through `associationIds` is a directory in the Agave Files
    API that contains all the data for the project. Additional metadata may also be
    associated to the project and to other Files objects within the Project collection.
    """

    name = 'designsafe.project'
    storage_system_id = 'designsafe.storage.projects'

    @classmethod
    def list_projects(cls, agave_client):
        """
        Get a list of Projects
        :param agave_client: agavepy.Agave: Agave API client instance
        :return:
        """
        query = {
            'name': Project.name
        }
        records = agave_client.meta.listMetadata(q=json.dumps(query), privileged=False)
        return [cls(agave_client=agave_client, **r) for r in records]

    @property
    def collaborators(self):
        permissions = BaseMetadataPermissionResource.list_permissions(
            self.uuid, self._agave)
        return [pem.username for pem in permissions]

    def add_collaborator(self, username):
        pem = BaseMetadataPermissionResource(self.uuid, self._agave)
        pem.username = username
        pem.read = True
        pem.write = True
        pem.save()

    @property
    def title(self):
        return self.value.get('title')

    @title.setter
    def title(self, value):
        self.value['title'] = value

    @property
    def pi(self):
        return self.value.get('pi')

    @pi.setter
    def pi(self, value):
        self.value['pi'] = value

    @property
    def co_pis(self):
        return self.value.get('co_pis', [])

    @co_pis.setter
    def co_pis(self, value):
        # TODO is this assertion valuable?
        # assert self.pi not in value
        self.value['co_pis'] = value

    @property
    def abstract(self):
        return self.value.get('abstract')

    @abstract.setter
    def abstract(self, value):
        self.value['abstract'] = value

    @property
    def project_directory(self):
        """
        Queries for the File object that represents the root of this Project's files.

        :return: The AgaveFile for this project's root dir
        :rtype: :class:`AgaveFile`
        """
        return AgaveFile.from_file_path(Project.storage_system_id,
                                        file_path=self.uuid,
                                        agave_client=self._agave)

    @project_directory.setter
    def project_directory(self, value):
        """
        Sets the passed :class:`AgaveFile` as the root dir for this Project's data by
        adding the :func:`AgaveFile.uuid` to the Project's `associationIds`.

        :param value: :class:`designsafe.apps.api.data.agave.file.AgaveFile`: The
        AgaveFile for this Project's root data dir.
        """
        # TODO
        # extract the UUID of the File and set it in the associationIds for the Project
        file_uuid = value.uuid
        self.associationIds.append(file_uuid)

    @property
    def project_data_listing(self, path=''):
        file_path = '/'.join([self.uuid, path])
        return AgaveFile.listing(Project.storage_system_id,
                                 file_path=file_path,
                                 agave_client=self._agave)

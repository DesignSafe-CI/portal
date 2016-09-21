import json
from . import BaseAgaveResource


class BaseMetadataResource(BaseAgaveResource):
    """
    Base class for Agave Metadata objects. Can be subclassed to add application-specific
    business logic.
    """

    def __init__(self, agave_client, **kwargs):
        super(BaseMetadataResource, self).__init__(agave_client)
        self.uuid = None
        self.owner = None
        self.schemaId = None
        self.internalUsername = None
        self.associationIds = []
        self.name = None
        self.value = {}
        self.lastUpdated = None
        self.created = None
        self._links = {}
        self.from_result(**kwargs)

    def from_result(self, **kwargs):
        self.uuid = kwargs.get('uuid')
        self.owner = kwargs.get('owner')
        self.schemaId = kwargs.get('schemaId')
        self.internalUsername = kwargs.get('internalUsername')
        self.associationIds = kwargs.get('associationIds', [])
        self.name = kwargs.get('name')
        self.value = kwargs.get('value', {})
        self.lastUpdated = kwargs.get('lastUpdated')
        self.created = kwargs.get('created')
        self._links = kwargs.get('_links')

    @property
    def request_body(self):
        """
        Creates an appropriate representation of this metadata object for persisting to
        the API backend

        :return: JSON representation suitable for persistence
        :rtype: string
        """
        return json.dumps({
            "schemaId": self.schemaId,
            "associationIds": self.associationIds,
            "name": self.name,
            "value": self.value
        })

    def save(self):
        """
        Saves or updates this metadata record.

        :return: self
        :rtype: :class:`BaseMetadataResource`
        """
        if self.uuid is None:
            result = self._agave.meta.addMetadata(body=self.request_body)
        else:
            result = self._agave.meta.updateMetadata(uuid=self.uuid,
                                                     body=self.request_body)
        self.from_result(**result)
        return self

    def fetch(self):
        """
        Gets fetches/refreshes this record from the API.

        :return: self
        :rtype: :class:`BaseMetadataResource`
        """
        if self.uuid:
            result = self._agave.meta.getMetadata(uuid=self.uuid)
            self.from_result(**result)
        return self


class BaseMetadataPermissionResource(BaseAgaveResource):
    """
    Permissions object for a :class:`BaseMetadataResource`.
    """

    def __init__(self, metadata_uuid, agave_client, **kwargs):
        super(BaseMetadataPermissionResource, self).__init__(agave_client)
        self.metadata_uuid = metadata_uuid
        self.username = None
        self._pems = {}
        self.from_result(**kwargs)

    def from_result(self, **kwargs):
        self.username = kwargs.get('username')
        self._pems = kwargs.get('permission', {})

    @property
    def read(self):
        return self._pems.get('read', False)

    @read.setter
    def read(self, value):
        self._pems['read'] = value

    @property
    def write(self):
        return self._pems['write']

    @write.setter
    def write(self, value):
        self._pems['write'] = value

    @property
    def permission_bit(self):
        if self.read:
            if self.write:
                return 'ALL'
            else:
                return 'READ'
        elif self.write:
            return 'WRITE'

        return 'NONE'

    @permission_bit.setter
    def permission_bit(self, value):
        if value == 'READ':
            self.read = True
            self.write = False
        elif value == 'WRITE':
            self.read = False
            self.write = True
        elif value == 'READ_WRITE':
            self.read = True
            self.write = True
        elif value == 'ALL':
            self.read = True
            self.write = True
        elif value == 'NONE':
            self.read = False
            self.write = False

    @property
    def request_body(self):
        return json.dumps({
            "username": self.username,
            "permission": self.permission_bit
        })

    def save(self):
        """
        Persist this permission

        :return: self
        :rtype: :class:`BaseMetadataPermissionResource`
        """
        result = self._agave.meta.updateMetadataPermissions(
            self.metadata_uuid, body=self.request_body)
        self.from_result(**result)
        return self

    def delete(self):
        """
        Delete this permission. Convenience method for setting read/write to False, then
        calling BaseMetadataPermission.save().

        :return: None
        """
        self.read = False
        self.write = False
        self.save()

    @classmethod
    def list_permissions(cls, metadata_uuid, agave_client):
        """
        Get the permissions for a metadata object
        :param metadata_uuid: string: the UUID of the metadata for which to list permissions
        :param agave_client: agavepy.Agave: API client instance

        :return: List of permissions for the passed Metadata UUID
        :rtype: list of designsafe.apps.api.agave.BaseMetadataPermission
        """
        records = agave_client.meta.listMetadataPermissions(uuid=metadata_uuid)
        return [cls(metadata_uuid, agave_client, **r) for r in records]

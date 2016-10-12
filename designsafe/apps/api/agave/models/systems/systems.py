import logging
from .. import BaseAgaveResource

logger = logging.getLogger(__name__)


class BaseSystemResource(BaseAgaveResource):

    def __init__(self, agave_client, **kwargs):
        super(BaseSystemResource, self).__init__(agave_client, **kwargs)

    @property
    def request_body(self):
        system_body = self._wrapped.copy()
        system_body.pop('lastModified')
        system_body.pop('revision')
        system_body.pop('_links')
        return system_body

    def add_role(self, username, role):
        role_body = {
            'username': username,
            'role': role
        }
        logger.info('Granting system role on {}: {}'.format(self.id, role_body))
        self._agave.systems.updateRole(systemId=self.id, body=role_body)
        return self

    def save(self, updates=None):
        system_body = self.request_body
        if updates is not None:
            system_body.update(**updates)
        result = self._agave.systems.update(systemId=self.id, body=system_body)
        self._wrapped.update(**result)
        return self

    @classmethod
    def add_system(cls, agave_client, system_tmpl):
        result = agave_client.systems.add(body=system_tmpl)
        return cls(agave_client, **result)

    @classmethod
    def from_id(cls, agave_client, system_id):
        """

        :param agavepy.agave.Agave agave_client: An Agave API client instance
        :param str system_id: The ID of the system
        :return: The system identified by the given system_id
        :rtype `class:BaseSystemResource`
        """
        result = agave_client.systems.get(systemId=system_id)
        return cls(agave_client, **result)

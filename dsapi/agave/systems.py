from agave import *
import requests
import json
import dsapi.agave.logs as agave_logging

logger = agave_logging.get_logger(__name__)

class AgaveSystems(Agave):
    def __init__(self, url, token=None):
        """
        url -- str, base URL to use for the agave api tenant.
        token -- str, token to use for Authorization.
        """
        Agave.__init__(self, url, token)
        self.urls = {
            'list': 'systems/v2/',
        }

    def __str__(self):
        return 'AgaveSystems : {0} - {1}'.format(self.url, self.token)

    def get_default(self):
        systems = super(AgaveSystems, self).send_secure('get', self.urls['list'])
        logger.info('Logging')
        logger.info('Systems: {0}'.format(systems))
        default = filter(lambda x: x['default'], systems)
        return default[0]

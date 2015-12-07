from agave import *
import requests
import json

class AgaveSystems(Agave):
    def __init__(self, url, token=None):
        """
        url -- str, base URL to use for the agave api tenant.
        token -- str, token to use for Authorization.
        """
        Agave.__init__(self, url, token)

    def __str__(self):
        return 'AgaveSystems : {0} - {1}'.format(self.url, self.token)

    def __list(self):
        headers = super(AgaveSystems, self).build_secure_headers()
        r = requests.get('{0}systems/v2/'.format(self.url), headers = headers)
        return r.json()['result']

    def get_default(self):
        systems = self.__list()
        default = filter(lambda x: x['default'], systems)
        return default[0]

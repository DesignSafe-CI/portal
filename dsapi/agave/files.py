from agave import *
from systems import *
import requests
import json

class AgaveFiles(Agave):
    def __init__(self, url, token=None):
        """
        url -- str, base URL to use for the agave api tenant.
        token -- str, token to use for Authorization.
        """
        Agave.__init__(self, url, token)
        self.urls = {
            'list': 'files/v2/listings/system/',
        }

    def __str__(self):
        return 'AgaveFiles : {0} - {1}'.format(self.url, self.token)

    def list_path(self, path):
        if path[0] == '/':
            path = path[1:]
        asys = AgaveSystems(self.url, self.token)
        ds = asys.get_default()
        r = super(AgaveFiles, self).send_secure('get', '{0}{1}/{2}',format(self.urls['list'], ds, url))
        result = r.json()['result']

        listing = [{'format': x['format'], 'name': x['name'], 'href': x['_links']['self']['href'].split(ds['id'])[-1]} for x in result if x['name'] != '.' and x['name'] != '..']
        return listing

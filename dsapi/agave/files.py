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

    def __str__(self):
        return 'AgaveFiles : {0} - {1}'.format(self.url, self.token)

    def list_path(self, path):
        asys = AgaveSystems(self.url, self.token)
        ds = asys.get_default()
        headers = super(AgaveFiles, self).build_secure_headers()
        r = requests.get('{0}files/v2/listings/system/{1}/{2}'.format(self.url, ds['id'], path), headers = headers)
        result = r.json()['result']
        listing = [{'format': x['format'], 'name': x['name'], 'href': x['_links']['self']} for x in result if x['name'] != '.' and x['name'] != '..']
        return listing

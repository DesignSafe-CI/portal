class Agave(object):
    def __init__(self, url, token=None):
        """
        url -- str, base URL to use for the agave api tenant.
        token -- str, token to use for Authorization.
        """
        if url is not None and url[-1] != '/':
            url += '/'
        self.url = url
        self.token = token

    def build_secure_headers(self):
        return {'Authorization': 'Bearer {0}'.format(self.token)}

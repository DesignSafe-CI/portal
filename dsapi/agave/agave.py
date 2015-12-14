import requests
import dsapi.agave.logs as agave_logging

logger = agave_logging.get_logger(__name__)

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

    def _build_secure_headers(self):
        """
        Creates the correct Authorization header for Agave
        """
        return {'Authorization': 'Bearer {0}'.format(self.token)}

    def send_secure(self, method, url, **kwargs):
        """
        Sends a secure request to a specified URL.
        url -- str, URL to request
        headers -- dict, extra headers to add.
        """
        request = getattr(requests, method)
        hs = self._build_secure_headers()
        headers = kwargs.setdefault('headers', {})
        headers.update(hs)
        r = request('{0}{1}'.format(self.url, url), **kwargs)
        if r.status_code != 200:
            logger.error('HTTPError: status_code: {0}, reason: {1}, test: {2}'.format(r.status_code, r.reason, r.text))
        r.raise_for_status()
        logger.info('Result: {0}'.format(r.text))
        return r.json()['result']

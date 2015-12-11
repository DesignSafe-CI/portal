import requests
import logging, traceback

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)
"""
# Use this if you want to log to a file
LOG_FILENAME = 'path/to/file/name'
handler = logging.handlers.TimedRotatingFileHandler(LOG_FILENAME, when='D', interval = 1, backupCount = 5)
"""
# Handler to log to std.err
handler = logging.StreamHandler()

formatter = logging.Formatter('[DJANGO] [%(asctime)s] %(levelname)s [%(name)s:%(lineno)s] %(message)s')
handler.setFormatter(formatter)
logger.addHandler(handler)

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
        logger.info('Headers: {0}'.format(kwargs['headers']))
        logger.info('URL: {0}'.format(url))
        r = request('{0}{1}'.format(self.url, url), **kwargs)
        if r.status_code != 200:
            logger.error('HTTPError: status_code: {0}, reason: {1}, test: {2}'.format(r.status_code, r.reason, r.text))
        r.raise_for_status()
        return r.json()['result']

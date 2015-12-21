from django.conf import settings

from agavepy.agave import Agave, Token
import logging
import time


logger = logging.getLogger(__name__)

class _AgaveStub(object):
    """
    A stub class to mimic the Agave object that is typically the "parent" of
    agavepy.agave.Token
    """

    def refresh_aris(self):
        pass

class AgaveTokenRefreshMiddleware(object):

    def process_request(self, request):
        if request.path != '/logout/':
            token_key = getattr(settings, 'AGAVE_TOKEN_SESSION_ID')
            if token_key in request.session:
                current_time = time.time()
                token = request.session[token_key]
                valid_seconds = token['created'] + token['expires_in'] - current_time
                if valid_seconds <= 0:
                    logger.debug('refreshing current token: %s' %
                        token['access_token'][:8].ljust(len(token), '-'))

                    agave_token = Token(None, None,
                        getattr(settings, 'AGAVE_TENANT_BASEURL'),
                        getattr(settings, 'AGAVE_CLIENT_KEY'),
                        getattr(settings, 'AGAVE_CLIENT_SECRET'), True, _AgaveStub())
                    agave_token.token_info = {'refresh_token': token['refresh_token']}
                    agave_token.refresh()
                    agave_token.token_info['created'] = current_time

                    request.session[token_key] = agave_token.token_info
                    request.session.save()

                    logger.info('refreshed token: %s' %
                        agave_token.token_info['access_token'][:8].ljust(len(token), '-'))
                else:
                    logger.debug('session.%s valid for %s additional seconds: %s' %
                        (token_key, valid_seconds,
                            token['access_token'][:8].ljust(len(token), '-')))


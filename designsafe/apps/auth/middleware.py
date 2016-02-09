from django.conf import settings
from django.contrib.auth import logout

from agavepy.agave import Agave
import logging
import time


logger = logging.getLogger(__name__)


class AgaveTokenRefreshMiddleware(object):

    def process_request(self, request):
        if request.path != '/logout/':
            token_key = getattr(settings, 'AGAVE_TOKEN_SESSION_ID')
            if token_key in request.session:
                current_time = time.time()
                token = request.session[token_key]
                valid_seconds = token['created'] + token['expires_in'] - current_time
                if valid_seconds <= 0:
                    masked_token = token['access_token'][:8].ljust(
                        len(token['access_token']), '-')
                    logger.debug('refreshing current token: %s' % masked_token)

                    ag = Agave(
                        api_server=getattr(settings, 'AGAVE_TENANT_BASEURL'),
                        api_key=getattr(settings, 'AGAVE_CLIENT_KEY'),
                        api_secret=getattr(settings, 'AGAVE_CLIENT_SECRET'),
                        token=token['access_token'], refresh_token=token['refresh_token'])
                    try:
                        ag.token.refresh()
                        ag.token.token_info['created'] = current_time
                        request.session[token_key] = ag.token.token_info
                        request.session.save()

                        masked_token = ag.token.token_info['access_token'][:8].ljust(
                            len(ag.token.token_info['access_token']), '-')
                        logger.debug('refreshed token: %s' % masked_token)
                    except:
                        logger.warn('Token refresh failed. Logging out...')
                        logout(request)
                else:
                    masked_token = token['access_token'][:8].ljust(
                        len(token['access_token']), '-')
                    logger.debug('session.%s valid for %s additional seconds: %s' %
                        (token_key, valid_seconds, masked_token))


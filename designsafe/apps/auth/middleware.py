from django.conf import settings
from django.contrib.auth import logout
from requests.exceptions import HTTPError
from .models import AgaveOAuthToken
import logging


logger = logging.getLogger(__name__)


class AgaveTokenRefreshMiddleware(object):

    def process_request(self, request):
        if request.path != '/logout/' and request.user.is_authenticated():
            token = request.user.agave_oauth
            try:
                if token and token.expired:
                    try:
                        token.refresh()
                        request.session[getattr(settings, 'AGAVE_TOKEN_SESSION_ID')] = \
                            token.token
                    except HTTPError as e:
                        logger.exception('Failed to refresh token for user=%s: %s' %
                                         (request.user.username, e.response))
                        logout(request)
            except AgaveOAuthToken.DoesNotExist:
                logger.warn('Agave Token missing for user=%s!' % request.user.username)

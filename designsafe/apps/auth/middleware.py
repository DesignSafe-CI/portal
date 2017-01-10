from django.contrib.auth import logout
from django.core.exceptions import ObjectDoesNotExist
from requests.exceptions import RequestException, HTTPError
import logging

logger = logging.getLogger(__name__)


class AgaveTokenRefreshMiddleware(object):

    def process_request(self, request):
        if request.path != '/logout/' and request.user.is_authenticated():
            try:
                agave_oauth = request.user.agave_oauth
                if agave_oauth.expired:
                    try:
                        agave_oauth.client.token.refresh()
                    except HTTPError:
                        logger.exception('Agave Token refresh failed; Forcing logout',
                                         extra={'user': request.user.username})
                        logout(request)
            except ObjectDoesNotExist:
                logger.warn('Authenticated user missing Agave API Token',
                            extra={'user': request.user.username})
                logout(request)
            except RequestException:
                logger.exception('Agave Token refresh failed. Forcing logout',
                                 extra={'user': request.user.username})
                logout(request)

    def process_response(self, request, response):
        response['Authorization'] = 'Bearer ' + request.user.agave_oauth.access_token
        return response

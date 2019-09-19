from django.contrib import auth
from django.contrib.auth import logout
from django.core.exceptions import ObjectDoesNotExist
from requests.exceptions import RequestException, HTTPError
import logging

# pylint: disable=invalid-name
logger = logging.getLogger(__name__)
# pylint: enable=invalid-name


def get_user(request):
    if not hasattr(request, '_cached_user'):
        request._cached_user = auth.get_user(request)
    return request._cached_user


class AgaveTokenRefreshMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        user = get_user(request)
        if request.path != '/logout/' and user.is_authenticated:
            try:
                agave_oauth = user.agave_oauth
                if agave_oauth.expired:
                    try:
                        agave_oauth.client.token.refresh()
                    except HTTPError:
                        logger.exception('Agave Token refresh failed; Forcing logout',
                                         extra={'user': user.username})
                        logout(request)
            except ObjectDoesNotExist:
                logger.warn('Authenticated user missing Agave API Token',
                            extra={'user': user.username})
                logout(request)
            except RequestException:
                logger.exception('Agave Token refresh failed. Forcing logout',
                                 extra={'user': user.username})
                logout(request)
        return response

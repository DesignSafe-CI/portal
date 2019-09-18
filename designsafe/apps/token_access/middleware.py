from django.http import HttpResponseForbidden
from .models import Token


class TokenAuthenticationMiddleware(object):
    """
    Middleware that checks the HTTP Authorization Header for Token authorization. If the
    Authorization header exists and the authorization type is 'Token', looks up the token
    and sets the related users in the request object. If the token is invalid, returns a
    403 error.
    """

    def __init__(self, get_response):
        """Init."""
        self.get_response = get_response

    def __call__(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION', None)
        if auth_header is not None:
            parts = auth_header.split(' ')
            if parts[0] == 'Token':
                token = parts[-1]
                try:
                    token = Token.objects.get(token=token)
                    request.user = token.user
                except Token.DoesNotExist:
                    return HttpResponseForbidden()
        return self.get_response(request)

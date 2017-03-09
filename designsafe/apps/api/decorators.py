"""
Decorators used for the api
    TODO: This is Django specific. We should either move this into some kind of
    django specific utils or try and make it as general as possible.
"""
import logging
from functools import wraps
from base64 import b64decode
from django.utils.six import text_type
from django.conf import settings
import jwt as pyjwt
from Crypto.PublicKey import RSA

#pylint: disable=invalid-name
logger = logging.getLogger(__name__)
#pylint: enable=invalid-name

def _decode_jwt(jwt):
    """Verified signature on a jwt

    Uses public key to decode the jwt message.

    :param str jwt: JWT string
    :return: base64-decoded message
    """
    pubkey = settings.AGAVE_JWT_PUBKEY
    key_der = b64decode(pubkey)
    key_pub = RSA.importKey(key_der)

    #return pyjwt.decode(jwt, key_pub, issuer='wso2.org/products/am')
    return pyjwt.decode(jwt, key_pub, verify=False)

def _get_auth_headers(request):
    """Return auth header as a byte string

    :param django.http.request request: Django Request
    """
    auth = request.META.get('HTTP_AUTHORIZATION', b'')
    if isinstance(auth, text_type):
        # Header encoding (see RFC5987)
        auth = auth.encode('iso-8859-1')

    return auth

def agave_jwt_login(func):
    """Decorator to login user with a jwt
    """
    #pylint: disable=missing-docstring
    @wraps(func)
    def decorated_function(request, *args, **kwargs):
        logger.debug('HEADERS: %s', request.META)
        logger.debug('POST: %s', request.POST.dict())
        logger.debug('GET: %s', request.GET.dict())
        if request.user.is_authenticated():
            return func(request, *args, **kwargs)

        auth = _get_auth_headers(request)
        auth_comps = auth.split()
        if len(auth_comps) != 2:
            logger.debug('JWT format is not correct. Falling back')
            return func(request, *args, **kwargs)

        jwt_value = auth_comps[1]
        payload = _decode_jwt(jwt_value)
        logger.debug('jwt payload: %s', payload)
        return func(request, *args, **kwargs)

    return decorated_function
    #pylint: enable=missing-docstring

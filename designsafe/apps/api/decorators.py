""" Decorators used for the api TODO: This is Django specific. We should either move this into some kind of
    django specific utils or try and make it as general as possible.
"""
import logging
from functools import wraps
from base64 import b64decode
from django.conf import settings
from django.http import HttpRequest
from django.contrib.auth import get_user_model
from django.contrib.auth import login
from django.core.exceptions import ObjectDoesNotExist
import jwt as pyjwt
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives.serialization import load_der_public_key
from cryptography.exceptions import UnsupportedAlgorithm
from tapipy.tapis import Tapis
from tapipy.errors import BaseTapyException

#pylint: disable=invalid-name
logger = logging.getLogger(__name__)
#pylint: enable=invalid-name

def _decode_jwt(jwt):
    """Verified signature on a jwt

    Uses public key to decode the jwt message.

    :param str jwt: JWT string
    :return: base64-decoded message
    """
    #pubkey = settings.AGAVE_JWT_PUBKEY
    pubkey = 'MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCUp/oV1vWc8/TkQSiAvTousMzO\nM4asB2iltr2QKozni5aVFu818MpOLZIr8LMnTzWllJvvaA5RAAdpbECb+48FjbBe\n0hseUdN5HpwvnH/DW8ZccGvk53I6Orq7hLCv1ZHtuOCokghz/ATrhyPq+QktMfXn\nRS4HrKGJTzxaCcU7OQIDAQAB'
    try:
        key_der = b64decode(pubkey)
        key = load_der_public_key(key_der, backend=default_backend())
    except (TypeError, ValueError, UnsupportedAlgorithm):
        logger.exception('Could not load public key.')
        return {}

    try:
        decoded = pyjwt.decode(jwt, key, issuer=settings.AGAVE_JWT_ISSUER)
    except pyjwt.exceptions.DecodeError as exc:
        logger.exception('Could not decode JWT. %s', exc)
        return {}
    return decoded


def _get_jwt_payload(request):
    """Return JWT payload as a string

    :param django.http.request request: Django Request
    :return: JWT payload
    :rtype: str
    """
    payload = request.META.get(settings.AGAVE_JWT_HEADER)
    if payload and isinstance(payload, str):
        # Header encoding (see RFC5987)
        payload = payload.encode('iso-8859-1')

    return payload


def tapis_jwt_login(func):
    """Decorator to log in a user with their Tapis OAuth token

    ..note::
        It will silently fail and continue executing the wrapped function
        if the JWT payload header IS NOT present in the request. If the JWT payload
        header IS present then it will continue executing the wrapped function passing
        the request object with the correct user logged-in.
    """
    #pylint: disable=missing-docstring
    @wraps(func)
    def decorated_function(request: HttpRequest, *args, **kwargs):
        if request.user.is_authenticated:
            return func(request, *args, **kwargs)

        tapis_jwt = request.headers.get('X-Tapis-Token')
        if not tapis_jwt:
            logger.debug('No JWT payload found. Falling back')
            return func(request, *args, **kwargs)

        tapis_client = Tapis(base_url=settings.TAPIS_TENANT_BASEURL)
        try:
            validation_response = tapis_client.validate_token(tapis_jwt)
        except BaseTapyException:
            return func(request, *args, **kwargs)
 
        tapis_username = validation_response['tapis/username']

        try:
            user = get_user_model().objects.get(username=tapis_username)
        except ObjectDoesNotExist:
            logger.exception('Could not find JWT user: %s', tapis_username)
            user = None

        if user is not None:
            login(request, user, backend="django.contrib.auth.backends.ModelBackend")

        return func(request, *args, **kwargs)

    return decorated_function
    #pylint: enable=missing-docstring


def agave_jwt_login(func):
    """Decorator to login user with a jwt

    ..note::
        It will sliently fail and continue executing the wrapped function
        if the JWT payload header IS NOT present in the request. If the JWT payload
        header IS present then it will continue executing the wrapped function passing
        the request object with the correct user logged-in.
        Because of this it is assumed that this decorator will be used together with
        :func:`django.contrib.auth.decorators.login_required` decorator. This way we do
        not disrupt your usual Django login config.

    ..note::
        If the username sent via `AGAVE_JWT_USER_CLAIM_FIELD` is equal to
        `AGAVE_JWT_SERVICE_ACCOUNT`, we expect the service account to be
        requesting a user's projects listing on their behalf, via the
        `user` url parameter.
    """
    #pylint: disable=missing-docstring
    @wraps(func)
    def decorated_function(request, *args, **kwargs):
        if request.user.is_authenticated:
            return func(request, *args, **kwargs)

        payload = _get_jwt_payload(request)
        if not payload:
            logger.debug('No JWT payload found. Falling back')
            return func(request, *args, **kwargs)

        jwt_payload = _decode_jwt(payload)
        if not jwt_payload:
            return None

        jwt_username = jwt_payload.get(settings.AGAVE_JWT_USER_CLAIM_FIELD, '')
        if jwt_username == settings.AGAVE_JWT_SERVICE_ACCOUNT:
            username = request.GET.get('user', jwt_username)
        else:
            username = jwt_username

        try:
            user = get_user_model().objects.get(username=username)
        except ObjectDoesNotExist:
            logger.exception('Could not find JWT user: %s', username)
            user = None

        if user is not None:
            login(request, user, backend="django.contrib.auth.backends.ModelBackend")

        return func(request, *args, **kwargs)

    return decorated_function
    #pylint: enable=missing-docstring

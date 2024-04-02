"""Utilities for APIs
"""

import logging
from django.conf import settings

# pylint: disable=invalid-name
logger = logging.getLogger(__name__)
# pylint: enable=invalid-name


def is_jwt(request):
    """Checks if a request is authenticated with a JWT

    :param obj request: Django request object

    ..note:: This function only checks if the correct header
    is present and if the value of said header is not empty.
    Use :func:`~designsafe.apps.api.decorators.agave_jwt_login` to
    decorate protected views.
    """
    val = request.META.get(settings.AGAVE_JWT_HEADER)
    if val:
        return True

    return False


def get_client_ip(request):
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        ip = x_forwarded_for.split(",")[-1].strip()
    else:
        ip = request.META.get("REMOTE_ADDR")
    return ip

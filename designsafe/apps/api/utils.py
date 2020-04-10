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

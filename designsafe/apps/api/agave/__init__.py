""" Utils for agave API.

    ..todo:: These should not live in __init__.py
    we should create an agave.utils or agave.libs module for these to live in."""

from agavepy.agave import Agave
from django.conf import settings


def get_service_account_client():
    """Return service account agave client.

    This service account should use 'ds_admin' token.

    ..note:: This service account is an admin account on the Agave tenant.

    ..todo:: Should we, instead, use `ds_user`?
             There might be some issues because of permissionas,
             but it might be a bit safer."""

    return Agave(api_server=settings.AGAVE_TENANT_BASEURL,
                 token=settings.AGAVE_SUPER_TOKEN)


def to_camel_case(snake_str):
    """Turn a snake_case string into a lowerCamelCase string.

    :param str snake_str:
    :return: lowerCamelCase string
    :rtype: str
    """
    underscore_prefix_len = 0
    while snake_str[underscore_prefix_len] == '_':
        underscore_prefix_len += 1

    parts = snake_str[underscore_prefix_len:].split('_')
    camel_case = parts[0] + ''.join(p.title() for p in parts[1:])
    return camel_case.rjust(len(camel_case) + underscore_prefix_len, '_')

from agavepy.agave import Agave
from django.conf import settings


def get_service_account_client():
    return Agave(api_server=settings.AGAVE_TENANT_BASEURL,
                 token=settings.AGAVE_SUPER_TOKEN)


def to_camel_case(snake_str):
    """
    Turn a snake_case string into a lowerCamelCase string.

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

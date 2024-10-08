""" Utils for agave API.

    ..todo:: These should not live in __init__.py
    we should create an agave.utils or agave.libs module for these to live in.
"""
import logging
import requests
from agavepy.agave import Agave, load_resource
from tapipy.tapis import Tapis
from django.conf import settings

logger = logging.getLogger(__name__)

AGAVE_RESOURCES = load_resource(getattr(settings, 'AGAVE_TENANT_BASEURL'))

def get_service_account_client_v2():
    """Return service account agave client.
    This service account should use 'ds_admin' token.
    ..note:: This service account is an admin account on the Agave tenant.
    ..todo:: Should we, instead, use `ds_user`?
             There might be some issues because of permissionas,
             but it might be a bit safer."""

    return Agave(api_server=settings.AGAVE_TENANT_BASEURL,
                 token=settings.AGAVE_SUPER_TOKEN,
                 resources=AGAVE_RESOURCES)


def get_service_account_client():
    """Return service account tapis client.

    This service account uses 'wma_prtl' token.
    """

    return Tapis(
        base_url=settings.TAPIS_TENANT_BASEURL,
        access_token=settings.TAPIS_ADMIN_JWT)


def get_tg458981_client():
    """Return tg458981 tapis client."""

    return Tapis(
        base_url=settings.TAPIS_TENANT_BASEURL,
        access_token=settings.TAPIS_TG458981_JWT)


# TODOV3: Remove sandbox account code
def get_sandbox_service_account_client():
    """Return sandbox service account"""
    return Tapis(
        base_url=settings.TAPIS_TENANT_BASEURL,
        access_token=settings.TAPIS_ADMIN_JWT)

def service_account():
    """Return prod or sandbox service client depending on setting.AGAVE_USE_SANDBOX"""
    if getattr(settings, 'AGAVE_USE_SANDBOX', False):
        return get_sandbox_service_account_client()

    return get_service_account_client()

def impersonate_service_account(username):
    """Return agave client as username.

    :param str username: Username to impersonate.
    """
    url = '/'.join([settings.AGAVE_TENANT_BASEURL, 'token'])
    cred = (settings.AGAVE_CLIENT_KEY, settings.AGAVE_CLIENT_SECRET)

    if getattr(settings, 'AGAVE_USE_SANDBOX', False):
        cred = (settings.AGAVE_SANDBOX_CLIENT_KEY, settings.AGAVE_SANDBOX_CLIENT_SECRET)

    body = {
        'grant_type': 'admin_password',
        'username': settings.DS_ADMIN_USERNAME,
        'password': settings.DS_ADMIN_PASSWORD,
        'token_username': '/'.join([settings.AGAVE_USER_STORE_ID, username]),
        'scope': 'PRODUCTION',
    }
    response = requests.post(url, data=body, auth=cred)
    response.raise_for_status()
    token_data = response.json()
    return Agave(
        api_server=settings.AGAVE_TENANT_BASEURL,
        api_key=cred[0],
        api_secret=cred[1],
        token=token_data['access_token'],
        resources=AGAVE_RESOURCES,
        refresh_token=token_data['access_token']
    )


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

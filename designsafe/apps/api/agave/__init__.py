from agavepy.agave import Agave
from django.conf import settings


def get_service_account_client():
    return Agave(api_server=settings.AGAVE_TENANT_BASEURL,
                 token=settings.AGAVE_SUPER_TOKEN)

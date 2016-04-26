from boxsdk import Client, OAuth2
from boxsdk.object.base_object import BaseObject
from django.conf import settings
import logging
import json

logger = logging.getLogger(__name__)


class BoxObjectJsonSerializer(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, BaseObject):
            return o._response_object
        else:
            return super(BoxObjectJsonSerializer, self).default(o)


def get_box_oauth(token):
    """
    Convenience method to get a Box OAuth2 object from a BoxUserToken.

    Args:
        token: a BoxUserToken

    Returns:
        A Box OAuth2 object configured with the client credentials, user token, and
        token refresh.

    """
    return OAuth2(
        client_id=settings.BOX_APP_CLIENT_ID,
        client_secret=settings.BOX_APP_CLIENT_SECRET,
        access_token=token.access_token,
        refresh_token=token.refresh_token,
        store_tokens=token.update_tokens
    )


def get_box_client(user):
    return Client(get_box_oauth(user.box_user_token))

from django.contrib.auth import get_user_model
from designsafe.apps.box_integration import util
import logging

logger = logging.getLogger(__name__)


def check_connection(username):
    """
    Checks if the user's Box.com connection is working.
    Args:
        username: The username of the User to connection test

    Returns:
        The remote Box.com user record as a dict

    Raises:
        BoxOAuthException: if authentication failed or if token failed to refresh
        BoxException: if other boxsdk errors
        BoxUserToken.DoesNotExist: if token does not exist for user
    """
    user = get_user_model().objects.get(username=username)
    client = util.get_box_client(user)
    box_user = client.user(user_id=u'me').get()
    return box_user

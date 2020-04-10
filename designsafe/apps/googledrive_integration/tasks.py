from django.contrib.auth import get_user_model
import logging

logger = logging.getLogger(__name__)


def check_connection(username):
    """
    Checks if the user's Google Drive connection is working.
    Args:
        username: The username of the User to connection test

    Returns:
        The remote Google Drive user record as a dict

    Raises:
        Exception: if other exception errors
        GoogleDriveUserToken.DoesNotExist: if token does not exist for user
    """
    user = get_user_model().objects.get(username=username)
    drive = user.googledrive_user_token.client
    request = drive.about().get(fields='user')
    response = request.execute()
    googledrive_user = response['user']
    return googledrive_user

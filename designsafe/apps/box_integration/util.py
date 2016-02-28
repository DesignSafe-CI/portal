from boxsdk import OAuth2
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


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


def get_item_path(item):
    """
    Get the full Box path to a Box Folder or File
    Args:
        item: a Box File or Folder object

    Returns: the full path to a Box Folder or File as a string

    """
    return '/'.join([p['name'] for p in item.path_collection['entries']])


def get_sync_path(item):
    """
    Get the relative path to the location where the file is synced on
    BOX_SYNC_AGAVE_SYSTEM. This is essentially the Box path below BOX_SYNC_FOLDER_NAME.
    Args:
        item: a Box File or Folder object

    Returns: The user-relative Agave path for the file on the BOX_SYNC_AGAVE_SYSTEM.

    """
    sync_path_parts = []
    append = False
    for p in item.path_collection['entries']:
        if append:
            sync_path_parts.append(p['name'])
        elif p['name'] == settings.BOX_SYNC_FOLDER_NAME:
            sync_path_parts.append(p['name'])
            append = True
    return '/'.join(sync_path_parts)


def check_item_in_sync_path(item):
    """
    Checks if the Box Folder or File is in the monitored BOX_SYNC_FOLDER_NAME.

    Args:
        item: a Box File or Folder object

    Returns: True if the item is a child of BOX_SYNC_FOLDER_NAME, False otherwise

    """
    sync_folder = next((p for p in item.path_collection['entries']
                        if p['name'] == settings.BOX_SYNC_FOLDER_NAME), None)
    return sync_folder is not None

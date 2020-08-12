from designsafe.apps.api.datafiles.operations import googledrive_operations
from django.core.exceptions import PermissionDenied
import logging


logger = logging.getLogger(__name__)

allowed_actions = {
    'private': ['listing', 'search', 'copy', 'download', 'mkdir',
                'move', 'rename', 'trash', 'preview', 'upload'],
    'public': ['listing', 'search', 'copy', 'download', 'preview'],
    'community': ['listing', 'search', 'copy', 'download', 'preview'],
}


def googledrive_get_handler(client, scheme, system, path, operation, **kwargs):
    if operation not in allowed_actions[scheme]:
        raise PermissionDenied
    op = getattr(googledrive_operations, operation)
    return op(client, system, path, **kwargs)


def googledrive_post_handler(client, scheme, system,
                       path, operation, body=None):
    if operation not in allowed_actions[scheme]:
        raise PermissionDenied("")

    op = getattr(googledrive_operations, operation)
    return op(client, system, path, **body)


def googledrive_put_handler(client, scheme, system,
                      path, operation, body=None):
    if operation not in allowed_actions[scheme]:
        raise PermissionDenied

    op = getattr(googledrive_operations, operation)

    return op(client, system, path, **body)

from designsafe.apps.api.datafiles.operations import box_operations
from django.core.exceptions import PermissionDenied
import logging


logger = logging.getLogger(__name__)

allowed_actions = {
    'private': ['listing', 'search', 'copy', 'download', 'mkdir',
                'move', 'rename', 'trash', 'preview', 'upload'],
    'public': ['listing', 'search', 'copy', 'download', 'preview'],
    'community': ['listing', 'search', 'copy', 'download', 'preview'],
}


def box_get_handler(client, scheme, system, path, operation, **kwargs):
    if operation not in allowed_actions[scheme]:
        raise PermissionDenied
    op = getattr(box_operations, operation)
    return op(client, system, path, **kwargs)


def box_post_handler(client, scheme, system,
                       path, operation, body=None):
    if operation not in allowed_actions[scheme]:
        raise PermissionDenied("")

    op = getattr(box_operations, operation)
    return op(client, system, path, **body)


def box_put_handler(client, scheme, system,
                      path, operation, body=None):
    if operation not in allowed_actions[scheme]:
        raise PermissionDenied

    op = getattr(box_operations, operation)

    return op(client, system, path, **body)

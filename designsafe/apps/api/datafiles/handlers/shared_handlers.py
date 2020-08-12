from designsafe.apps.api.datafiles.operations import shared_operations
from django.core.exceptions import PermissionDenied
import logging


logger = logging.getLogger(__name__)

allowed_actions = {
    'private': ['listing', 'detail', 'preview', 'download', 'search', 'copy'],
    'public': [],
    'community': [],
}


def shared_get_handler(client, scheme, system, path, username, operation, **kwargs):
    if operation not in allowed_actions[scheme]:
        raise PermissionDenied
    op = getattr(shared_operations, operation)
    return op(client, system, path, username, **kwargs)


def shared_put_handler(client, scheme, system,
                      path, operation, body=None):
    if operation not in allowed_actions[scheme]:
        raise PermissionDenied

    op = getattr(shared_operations, operation)
    

    return op(client, system, path, **body)

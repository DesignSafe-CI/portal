from designsafe.apps.api.datafiles.operations import agave_operations
from designsafe.apps.api.datafiles.notifications import notify
from django.core.exceptions import PermissionDenied
import logging

logger = logging.getLogger(__name__)

allowed_actions = {
    'private': ['listing', 'detail', 'search', 'copy', 'download', 'mkdir',
                'move', 'rename', 'trash', 'preview', 'upload'],
    'public': ['listing', 'detail', 'search', 'copy', 'download', 'preview'],
    'community': ['listing', 'detail', 'search', 'copy', 'download', 'preview'],
}
notify_actions = ['move', 'copy', 'rename', 'trash', 'mkdir', 'upload']


def agave_get_handler(client, scheme, system, path, operation, **kwargs):
    if operation not in allowed_actions[scheme]:
        raise PermissionDenied
    op = getattr(agave_operations, operation)
    return op(client, system, path, **kwargs)


def agave_post_handler(username, client, scheme, system,
                       path, operation, body=None):

    if operation not in allowed_actions[scheme]:
        raise PermissionDenied

    op = getattr(agave_operations, operation)
    operation in notify_actions and notify(username, operation, '{} operation has started.'.format(operation.capitalize()), 'INFO', {})

    try:
        result =  op(client, system, path, **body)
        operation in notify_actions and notify(username, operation, '{} operation was successful.'.format(operation.capitalize()), 'SUCCESS', result)
        return result
    except Exception as exc:
        operation in notify_actions and notify(username, operation, 'File operation {} could not be completed.'.format(operation.capitalize()), 'ERROR', {})
        raise exc



def agave_put_handler(username, client, scheme, system,
                      path, operation, body=None):
    if operation not in allowed_actions[scheme]:
        raise PermissionDenied

    op = getattr(agave_operations, operation)
    operation in notify_actions and notify(username, operation, '{} operation has started.'.format(operation.capitalize()), 'INFO', {})

    try:
        result = op(client, system, path, **body)
        operation in notify_actions and notify(username, operation, '{} operation was successful.'.format(operation.capitalize()), 'SUCCESS', result)
        return result
    except Exception as exc:
        operation in notify_actions and notify(username, operation, 'File operation {} could not be completed.'.format(operation.capitalize()), 'ERROR', {})
        raise exc

    

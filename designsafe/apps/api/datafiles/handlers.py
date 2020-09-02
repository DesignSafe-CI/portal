from designsafe.apps.api.datafiles.operations import agave_operations
from designsafe.apps.api.datafiles.notifications import notify
from django.core.urlresolvers import reverse
from django.core.exceptions import PermissionDenied
import logging
from designsafe.apps.api.exceptions import ApiException
from designsafe.apps.api.datafiles.operations import agave_operations
from designsafe.apps.api.datafiles.operations import googledrive_operations
from designsafe.apps.api.datafiles.operations import dropbox_operations
from designsafe.apps.api.datafiles.operations import box_operations
from designsafe.apps.api.datafiles.operations import shared_operations

logger = logging.getLogger(__name__)

allowed_actions = {
    'private': ['listing', 'detail', 'search', 'copy', 'download', 'mkdir',
                'move', 'rename', 'trash', 'preview', 'upload'],
    'public': ['listing', 'detail', 'search', 'copy', 'download', 'preview'],
    'community': ['listing', 'detail', 'search', 'copy', 'download', 'preview'],
}
notify_actions = ['move', 'copy', 'rename', 'trash', 'mkdir', 'upload']

operations_mapping = {
    'agave': agave_operations,
    'googledrive': googledrive_operations,
    'box': box_operations,
    'dropbox': dropbox_operations,
    'shared': shared_operations
}


def datafiles_get_handler(api, client, scheme, system, path, operation, **kwargs):
    if operation not in allowed_actions[scheme]:
        raise PermissionDenied
    op = getattr(operations_mapping[api], operation)
    logger.debug(op)
    return op(client, system, path, **kwargs)


def datafiles_post_handler(api, username, client, scheme, system,
                           path, operation, body=None):

    if operation not in allowed_actions[scheme]:
        raise PermissionDenied

    op = getattr(operations_mapping[api], operation)
    operation in notify_actions and notify(username, operation, '{} operation has started.'.format(operation.capitalize()), 'INFO', {})

    try:
        result = op(client, system, path, **body)
        operation in notify_actions and notify(username, operation, '{} operation was successful.'.format(operation.capitalize()), 'SUCCESS', result)
        return result
    except Exception as exc:
        operation in notify_actions and notify(username, operation, 'File operation {} could not be completed.'.format(operation.capitalize()), 'ERROR', {})
        raise exc


def datafiles_put_handler(api, username, client, scheme, system,
                          path, operation, body=None):
    if operation not in allowed_actions[scheme]:
        raise PermissionDenied

    op = getattr(operations_mapping[api], operation)
    operation in notify_actions and notify(username, operation, '{} operation has started.'.format(operation.capitalize()), 'INFO', {})

    try:
        result = op(client, system, path, **body)
        operation in notify_actions and notify(username, operation, '{} operation was successful.'.format(operation.capitalize()), 'SUCCESS', result)
        return result
    except Exception as exc:
        operation in notify_actions and notify(username, operation, 'File operation {} could not be completed.'.format(operation.capitalize()), 'ERROR', {})
        raise exc


def resource_unconnected_handler(api):
    if api == 'googledrive':
        message = 'Connect your Google Drive account <a href="' + reverse('googledrive_integration:index') + '">here</a>'
        return ApiException(status=400, message=message, extra={
            'action_url': reverse('googledrive_integration:index'),
            'action_label': 'Connect Google Drive Account'
        })
    if api == 'dropbox':
        message = 'Connect your Dropbox account <a href="' + reverse('dropbox_integration:index') + '">here</a>'
        return ApiException(status=400, message=message, extra={
            'action_url': reverse('dropbox_integration:index'),
            'action_label': 'Connect Dropbox.com Account'
        })
    if api == 'box':
        message = 'Connect your Box account <a href="' + reverse('box_integration:index') + '">here</a>'
        return ApiException(status=400, message=message, extra={
            'action_url': reverse('box_integration:index'),
            'action_label': 'Connect Box.com Account'
        })
    else:
        message = 'There was an error accessing this storage system.'
        return ApiException(status=400, message=message)


def resource_expired_handler(api):
    if api == 'googledrive':
        message = 'While you previously granted this application access to Dropbox, ' \
            'that grant appears to be no longer valid. Please ' \
            '<a href="%s">disconnect and reconnect your Dropbox.com account</a> ' \
            'to continue using Dropbox data.' % reverse('dropbox_integration:index')
        return ApiException(status=403, message=message)
    if api == 'dropbox':
        message = 'While you previously granted this application access to Dropbox, ' \
            'that grant appears to be no longer valid. Please ' \
            '<a href="%s">disconnect and reconnect your Dropbox.com account</a> ' \
            'to continue using Dropbox data.' % reverse('dropbox_integration:index')
        raise ApiException(status=403, message=message)
    if api == 'box':
        # user needs to reconnect with Box
        message = 'While you previously granted this application access to Box, ' \
            'that grant appears to be no longer valid. Please ' \
            '<a href="%s">disconnect and reconnect your Box.com account</a> ' \
            'to continue using Box data.' % reverse('box_integration:index')
        raise ApiException(status=403, message=message)
    else:
        message = 'There was an error accessing this storage system.'
        return ApiException(status=400, message=message)

import logging
from django.core.exceptions import PermissionDenied
from django.urls import reverse
from tapipy.errors import BaseTapyException, InternalServerError, UnauthorizedError
from designsafe.apps.api.datafiles.notifications import notify
from designsafe.apps.api.datafiles.operations import tapis_operations
from designsafe.apps.api.datafiles.operations import googledrive_operations
from designsafe.apps.api.datafiles.operations import dropbox_operations
from designsafe.apps.api.datafiles.operations import box_operations
from designsafe.apps.api.datafiles.operations import shared_operations
from designsafe.apps.api.exceptions import ApiException
from designsafe.libs.common.decorators import retry
from designsafe.apps.workspace.api.views import test_system_needs_keys

logger = logging.getLogger(__name__)

allowed_actions = {
    'private': ['listing', 'detail', 'search', 'copy', 'download', 'mkdir',
                'move', 'rename', 'trash', 'preview', 'upload', 'logentity'],
    'public': ['listing', 'detail', 'search', 'copy', 'download', 'preview', 'logentity'],
    'community': ['listing', 'detail', 'search', 'copy', 'download', 'preview', 'logentity'],
}
notify_actions = ['move', 'copy', 'rename', 'trash', 'mkdir', 'upload']

operations_mapping = {
    'agave': tapis_operations,
    'tapis': tapis_operations,
    'googledrive': googledrive_operations,
    'box': box_operations,
    'dropbox': dropbox_operations,
    'shared': shared_operations
}


@retry(UnauthorizedError, tries=3, max_time=15)
def datafiles_get_handler(api, client, scheme, system, path, operation, username=None, tapis_tracking_id=None, **kwargs):
    if operation not in allowed_actions[scheme]:
        raise PermissionDenied
    op = getattr(operations_mapping[api], operation)

    try:
        return op(client, system, path, username=username, tapis_tracking_id=tapis_tracking_id, **kwargs)
    except (InternalServerError, UnauthorizedError):
        system_needs_keys = test_system_needs_keys(client, username, system, path)
        if system_needs_keys:
            logger.error(
                f"Keys for user {username} must be manually pushed to system: {system_needs_keys.id}"
            )
        raise
    except BaseTapyException as exc:
        raise ApiException(message=exc.message, status=500) from exc


def datafiles_post_handler(api, username, client, scheme, system,
                           path, operation, body=None, tapis_tracking_id=None):

    if operation not in allowed_actions[scheme]:
        raise PermissionDenied

    op = getattr(operations_mapping[api], operation)
    operation in notify_actions and notify(username, operation, '{} operation has started.'.format(operation.capitalize()), 'INFO', {})

    try:
        result = op(client, system, path, tapis_tracking_id=tapis_tracking_id, **body)
        operation in notify_actions and notify(username, operation, '{} operation was successful.'.format(operation.capitalize()), 'SUCCESS', result)
        return result
    except Exception as exc:
        operation in notify_actions and notify(username, operation, 'File operation {} could not be completed.'.format(operation.capitalize()), 'ERROR', {})
        raise exc


def datafiles_put_handler(api, username, client, scheme, system,
                          path, operation, body=None, tapis_tracking_id=None):
    if operation not in allowed_actions[scheme]:
        raise PermissionDenied

    op = getattr(operations_mapping[api], operation)
    operation in notify_actions and notify(username, operation, '{} operation has started.'.format(operation.capitalize()), 'INFO', {})

    try:
        result = op(client, system, path, username=username, tapis_tracking_id=tapis_tracking_id, **body)
        if operation == 'copy' and system != body.get('dest_system', None):
            notify(username, operation, 'Your file transfer request has been received and will be processed shortly.'.format(operation.capitalize()), 'SUCCESS', result)
        else:
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
        message = 'While you previously granted this application access to Google Drive, ' \
            'that grant appears to be no longer valid. Please ' \
            '<a href="%s">disconnect and reconnect your Google Drive account</a> ' \
            'to continue using Google Drive data.' % reverse('googledrive_integration:index')
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

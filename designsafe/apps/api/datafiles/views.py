from designsafe.apps.api.views import BaseApiView
from django.core.urlresolvers import reverse
from django.http import JsonResponse, HttpResponseForbidden, FileResponse
from django.conf import settings
from django.contrib.auth import get_user_model
from requests.exceptions import HTTPError
from boxsdk.exception import BoxOAuthException
from dropbox.exceptions import AuthError
import json
import logging
from designsafe.apps.api.exceptions import ApiException
from designsafe.apps.api.datafiles.handlers.agave_handlers import agave_get_handler, agave_put_handler, agave_post_handler
from designsafe.apps.api.datafiles.handlers.shared_handlers import shared_get_handler, shared_put_handler
from designsafe.apps.api.datafiles.handlers.googledrive_handlers import googledrive_get_handler, googledrive_put_handler
from designsafe.apps.api.datafiles.handlers.dropbox_handlers import dropbox_get_handler, dropbox_put_handler
from designsafe.apps.api.datafiles.handlers.box_handlers import box_get_handler, box_put_handler
from designsafe.apps.api.datafiles.operations.transfer_operations import transfer, transfer_folder
from designsafe.apps.api.datafiles.notifications import notify
# Create your views here.

logger = logging.getLogger(__name__)
metrics = logging.getLogger('metrics')


class AgaveFilesView(BaseApiView):
    def get(self, request, operation=None, scheme='private', system=None, path='/'):

        metrics.info('Data Depot',
                     extra={
                         'user': request.user.username,
                         'sessionId': getattr(request.session, 'session_key', ''),
                         'operation': operation,
                         'info': {
                             'api': 'agave',
                             'systemId': system,
                             'filePath': path,
                             'query': request.GET.dict()}
                     })

        if not request.user.is_authenticated:
            client = get_user_model().objects.get(username='envision').agave_oauth.client
        else:
            client = request.user.agave_oauth.client
        try:
            response = agave_get_handler(
                client, scheme, system, path, operation, **request.GET.dict())
            return JsonResponse(response)
        except HTTPError as e:
            return JsonResponse({'message': str(e)}, status=e.response.status_code)

    def put(self, request, operation=None, scheme='private',
            handler=None, system=None, path='/'):

        body = json.loads(request.body)

        metrics.info('Data Depot',
                     extra={
                         'user': request.user.username,
                         'sessionId': getattr(request.session, 'session_key', ''),
                         'operation': operation,
                         'info': {
                             'api': 'agave',
                             'scheme': scheme,
                             'system': system,
                             'path': path,
                             'body': body
                         }
                     })

        try:
            client = request.user.agave_oauth.client
        except AttributeError:
            return HttpResponseForbidden

        try:
            response = agave_put_handler(request.user.username, client, scheme, system, path, operation, body=body)
        except HTTPError as e:
            return JsonResponse({'message': str(e)}, status=e.response.status_code)

        return JsonResponse(response)

    def post(self, request, operation=None, scheme='private',
             handler=None, system=None, path='/'):
        post_files = request.FILES.dict()
        post_body = request.POST.dict()
        metrics.info('Data Depot',
                     extra={
                         'user': request.user.username,
                         'sessionId': getattr(request.session, 'session_key', ''),
                         'operation': operation,
                         'info': {
                             'api': 'agave',
                             'scheme': scheme,
                             'system': system,
                             'path': path,
                         }})

        try:
            client = request.user.agave_oauth.client
        except AttributeError:
            return HttpResponseForbidden()

        response = agave_post_handler(request.user.username, client, scheme, system, path, operation, body={**post_files, **post_body})

        return JsonResponse(response)


class SharedFilesView(BaseApiView):
    def get(self, request, operation=None, scheme='private', system=None, path=''):
        metrics.info('Data Depot',
                     extra={
                         'user': request.user.username,
                         'sessionId': getattr(request.session, 'session_key', ''),
                         'operation': operation,
                         'info': {
                             'api': 'shared',
                             'systemId': system,
                             'filePath': path,
                             'query': request.GET.dict()}
                     })
        try:
            client = request.user.agave_oauth.client
        except AttributeError:
            client = None
        username = request.user.username
        try:
            response = shared_get_handler(
                client, scheme, system, path, username, operation, **request.GET.dict())
            return JsonResponse(response)
        except HTTPError as e:
            return JsonResponse({'message': str(e)}, status=e.response.status_code)

    def put(self, request, operation=None, scheme='private',
            handler=None, system=None, path='/'):

        metrics.info('Data Depot',
                     extra={
                         'user': request.user.username,
                         'sessionId': getattr(request.session, 'session_key', ''),
                         'operation': operation,
                         'info': {
                             'api': 'shared',
                             'scheme': scheme,
                             'system': system,
                             'path': path,
                             'body': body
                         }
                     })

        body = json.loads(request.body)
        try:
            client = request.user.agave_oauth.client
        except AttributeError:
            return HttpResponseForbidden

        response = shared_put_handler(client, scheme, system, path, operation, body=body)

        return JsonResponse(response)


class GoogledriveFilesView(BaseApiView):
    def get(self, request, operation=None, scheme='private', system=None, path='root'):
        metrics.info('Data Depot',
                     extra={
                         'user': request.user.username,
                         'sessionId': getattr(request.session, 'session_key', ''),
                         'operation': operation,
                         'info': {
                             'api': 'googledrive',
                             'systemId': system,
                             'filePath': path,
                             'query': request.GET.dict()}
                     })
        try:
            client = request.user.googledrive_user_token.client
        except AttributeError:
            message = 'Connect your Google Drive account <a href="' + reverse('googledrive_integration:index') + '">here</a>'
            raise ApiException(status=400, message=message, extra={
                'action_url': reverse('googledrive_integration:index'),
                'action_label': 'Connect Google Drive Account'
            })
        try:
            response = googledrive_get_handler(
                client, scheme, system, path, operation, **request.GET.dict())
            return JsonResponse(response)
        except Exception as e:
            if 'invalid_grant' in str(e):
                message = 'While you previously granted this application access to Google Drive, ' \
                    'that grant appears to be no longer valid. Please ' \
                    '<a href="{}">disconnect and reconnect your Google Drive account</a> ' \
                    'to continue using Google Drive data.'.format(reverse('googledrive_integration:index'))
                raise ApiException(status=401, message=message)

            message = 'Unable to communicate with Google Drive: {}'.format(e)
            raise ApiException(status=500, message=message)

    def put(self, request, operation=None, scheme='private',
            handler=None, system=None, path=''):
        metrics.info('Data Depot',
                     extra={
                         'user': request.user.username,
                         'sessionId': getattr(request.session, 'session_key', ''),
                         'operation': operation,
                         'info': {
                             'api': 'googledrive',
                             'scheme': scheme,
                             'system': system,
                             'path': path,
                             'body': body
                         }
                     })

        body = json.loads(request.body)
        try:
            client = request.user.googledrive_user_token.client
        except AttributeError:
            return HttpResponseForbidden

        response = googledrive_put_handler(client, scheme, system, path, operation, body=body)

        return JsonResponse(response)


class DropboxFilesView(BaseApiView):
    def get(self, request, operation=None, scheme='private', system=None, path=''):
        metrics.info('Data Depot',
                     extra={
                         'user': request.user.username,
                         'sessionId': getattr(request.session, 'session_key', ''),
                         'operation': operation,
                         'info': {
                             'api': 'dropbox',
                             'systemId': system,
                             'filePath': path,
                             'query': request.GET.dict()}
                     })
        try:
            client = request.user.dropbox_user_token.client
        except AttributeError:
            message = 'Connect your Dropbox account <a href="' + reverse('dropbox_integration:index') + '">here</a>'
            raise ApiException(status=400, message=message, extra={
                'action_url': reverse('dropbox_integration:index'),
                'action_label': 'Connect Dropbox.com Account'
            })
        try:
            response = dropbox_get_handler(
                client, scheme, system, path, operation, **request.GET.dict())
            return JsonResponse(response)
        except AuthError:
            # user needs to reconnect with Dropbox
            message = 'While you previously granted this application access to Dropbox, ' \
                      'that grant appears to be no longer valid. Please ' \
                      '<a href="%s">disconnect and reconnect your Dropbox.com account</a> ' \
                      'to continue using Dropbox data.' % reverse('dropbox_integration:index')
            raise ApiException(status=403, message=message)

    def put(self, request, operation=None, scheme='private',
            handler=None, system=None, path=''):
        
        metrics.info('Data Depot',
                     extra={
                         'user': request.user.username,
                         'sessionId': getattr(request.session, 'session_key', ''),
                         'operation': operation,
                         'info': {
                             'api': 'dropbox',
                             'scheme': scheme,
                             'system': system,
                             'path': path,
                             'body': body
                         }
                     })

        body = json.loads(request.body)
        try:
            client = request.user.dropbox_user_token.client
        except AttributeError:
            return HttpResponseForbidden

        response = dropbox_put_handler(client, scheme, system, path, operation, body=body)

        return JsonResponse(response)


class BoxFilesView(BaseApiView):
    def get(self, request, operation=None, scheme='private', system=None, path=''):
        metrics.info('Data Depot',
                     extra={
                         'user': request.user.username,
                         'sessionId': getattr(request.session, 'session_key', ''),
                         'operation': operation,
                         'info': {
                             'api': 'box',
                             'systemId': system,
                             'filePath': path,
                             'query': request.GET.dict()}
                     })
        try:
            client = request.user.box_user_token.client
        except AttributeError:
            message = 'Connect your Box account <a href="' + reverse('box_integration:index') + '">here</a>'
            raise ApiException(status=400, message=message, extra={
                'action_url': reverse('box_integration:index'),
                'action_label': 'Connect Box.com Account'
            })

        try:
            response = box_get_handler(
                client, scheme, system, path, operation, **request.GET.dict())
            return JsonResponse(response)
        except BoxOAuthException:
            # user needs to reconnect with Box
            message = 'While you previously granted this application access to Box, ' \
                      'that grant appears to be no longer valid. Please ' \
                      '<a href="%s">disconnect and reconnect your Box.com account</a> ' \
                      'to continue using Box data.' % reverse('box_integration:index')
            raise ApiException(status=403, message=message)

    def put(self, request, operation=None, scheme='private',
            handler=None, system=None, path=''):

        metrics.info('Data Depot',
                     extra={
                         'user': request.user.username,
                         'sessionId': getattr(request.session, 'session_key', ''),
                         'operation': operation,
                         'info': {
                             'api': 'box',
                             'scheme': scheme,
                             'system': system,
                             'path': path,
                             'body': body
                         }
                     })

        body = json.loads(request.body)
        try:
            client = request.user.box_user_token.client
        except AttributeError:
            return HttpResponseForbidden

        response = box_put_handler(client, scheme, system, path, operation, body=body)

        return JsonResponse(response)


class TransferFilesView(BaseApiView):
    def put(self, request, format):
        client_lookup = {
            'agave': request.user.agave_oauth.client,
            'googledrive': request.user.googledrive_user_token.client,
            'dropbox': request.user.dropbox_user_token.client,
            'box': request.user.box_user_token.client
        }
        body = json.loads(request.body)

        metrics.info('Data Depot',
                     extra={
                         'user': request.user.username,
                         'sessionId': getattr(request.session, 'session_key', ''),
                         'operation': 'transfer',
                         'info': {
                             'body': body
                         }
                     })

        src_client = client_lookup[body['src_api']]
        dest_client = client_lookup[body['dest_api']]

        notify(request.user.username, 'transfer', 'Copy operation has started.', 'INFO', {})
        try:
            if format == 'folder':
                resp = transfer_folder(src_client, dest_client, **body)
                notify(request.user.username, 'transfer', 'Files were successfully copied.', 'SUCCESS', {})
                return JsonResponse({'success': True})
            else:
                resp = transfer(src_client, dest_client, **body)
                notify(request.user.username, 'transfer', 'Files were successfully copied.', 'SUCCESS', {})
                return JsonResponse({'success': True})
        except Exception as exc:
            notify(request.user.username, 'transfer', 'Copy operation has failed.', 'ERROR', {})
            logger.info(exc)
            raise exc

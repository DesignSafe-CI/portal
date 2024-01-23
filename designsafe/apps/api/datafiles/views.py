import json
import logging
from boxsdk.exception import BoxOAuthException
from django.http import JsonResponse
from django.contrib.auth import get_user_model
from designsafe.apps.api.datafiles.handlers import datafiles_get_handler, datafiles_post_handler, datafiles_put_handler, resource_unconnected_handler, resource_expired_handler
from designsafe.apps.api.datafiles.operations.transfer_operations import transfer, transfer_folder
from designsafe.apps.api.datafiles.notifications import notify
from designsafe.apps.api.datafiles.models import DataFilesSurveyResult, DataFilesSurveyCounter
from designsafe.apps.api.views import BaseApiView
from designsafe.apps.api.agave import service_account
from dropbox.exceptions import AuthError as DropboxAuthError
from google.auth.exceptions import GoogleAuthError
from requests.exceptions import HTTPError

from designsafe.apps.api.utils import get_client_ip
# Create your views here.

logger = logging.getLogger(__name__)
metrics = logging.getLogger('metrics')


def get_client(user, api):
    client_mappings = {
        'agave': 'agave_oauth',
        'tapis': 'agave_oauth',
        'shared': 'agave_oauth',
        'googledrive': 'googledrive_user_token',
        'box': 'box_user_token',
        'dropbox': 'dropbox_user_token'
    }
    return getattr(user, client_mappings[api]).client


class DataFilesView(BaseApiView):
    def get(self, request, api, operation=None, scheme='private', system=None, path=''):

        doi = request.GET.get('doi', None)
        
        metrics.info('Data Depot',
                     extra={
                         'user': request.user.username,
                         'sessionId': getattr(request.session, 'session_key', ''),
                         'operation': operation,
                         'agent': request.META.get('HTTP_USER_AGENT'),
                         'ip': get_client_ip(request),
                         'info': {
                             'api': api,
                             'systemId': system,
                             'filePath': path,
                             'doi': doi,
                             'query': request.GET.dict()}
                     })

        if request.user.is_authenticated:
            try:
                client = get_client(request.user, api)
            except AttributeError:
                raise resource_unconnected_handler(api)
        elif api == 'agave' or api == 'tapis':
            client = service_account()
        else:
            return JsonResponse({'message': 'Please log in to access this feature.'}, status=403)

        try:
            response = datafiles_get_handler(
                api, client, scheme, system, path, operation, username=request.user.username, **request.GET.dict())
            return JsonResponse(response)
        except (BoxOAuthException, DropboxAuthError, GoogleAuthError):
            raise resource_expired_handler(api)
        except HTTPError as e:
            return JsonResponse({'message': str(e)}, status=e.response.status_code)

    def put(self, request, api, operation=None, scheme='private', system=None, path='/'):

        body = json.loads(request.body)
        doi = request.GET.get('doi', None)

        metrics.info('Data Depot',
                     extra={
                         'user': request.user.username,
                         'sessionId': getattr(request.session, 'session_key', ''),
                         'operation': operation,
                         'agent': request.META.get('HTTP_USER_AGENT'),
                         'ip': get_client_ip(request),
                         'info': {
                             'api': api,
                             'scheme': scheme,
                             'system': system,
                             'path': path,
                             'body': body,
                             'doi': doi
                         }
                     })

        client = None
        if request.user.is_authenticated:
            try:
                client = get_client(request.user, api)
            except AttributeError:
                raise resource_unconnected_handler(api)

        try:
            response = datafiles_put_handler(api, request.user.username, client, scheme, system, path, operation, body=body)
        except HTTPError as e:
            return JsonResponse({'message': str(e)}, status=e.response.status_code)

        return JsonResponse(response)

    # uploads come through here...
    def post(self, request, api, operation=None, scheme='private', system=None, path='/'):
        post_files = request.FILES.dict()
        post_body = request.POST.dict()
        metrics.info('Data Depot',
                     extra={
                         'user': request.user.username,
                         'sessionId': getattr(request.session, 'session_key', ''),
                         'operation': operation,
                         'agent': request.META.get('HTTP_USER_AGENT'),
                         'ip': get_client_ip(request),
                         'info': {
                             'api': api,
                             'scheme': scheme,
                             'system': system,
                             'path': path,
                             'body': post_body
                         }})

        if request.user.is_authenticated:
            try:
                client = get_client(request.user, api)
            except AttributeError:
                raise resource_unconnected_handler(api)

        response = datafiles_post_handler(api, request.user.username, client, scheme, system, path, operation, body={**post_files, **post_body})

        return JsonResponse(response)


class TransferFilesView(BaseApiView):
    def put(self, request, format):
        body = json.loads(request.body)

        metrics.info('Data Depot',
                     extra={
                         'user': request.user.username,
                         'sessionId': getattr(request.session, 'session_key', ''),
                         'operation': 'transfer',
                         'agent': request.META.get('HTTP_USER_AGENT'),
                         'ip': get_client_ip(request),
                         'info': {
                             'body': body
                         }
                     })

        src_client = get_client(request.user, body['src_api'])
        dest_client = get_client(request.user, body['dest_api'])

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


class MicrosurveyView(BaseApiView):
    def post(self, request):
        body = json.loads(request.body)
        survey_result = DataFilesSurveyResult(
            project_id=body.get('projectId'),
            comments=body.get('comments'),
            reasons=body.get('reasons'),
            professional_level=body.get('professionalLevel'),
            did_collect=body.get('didCollect')
        )
        survey_result.save()

        return JsonResponse({'success': True})

    def put(self, request):
        counter = DataFilesSurveyCounter.objects.all()[0]
        counter.count += 1
        counter.save()
        return JsonResponse({'show': (counter.count % 7 == 0)})

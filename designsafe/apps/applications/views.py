from agavepy.agave import Agave, AgaveException
from designsafe.apps.licenses.models import LICENSE_TYPES
from designsafe.apps.notifications.views import get_number_unread_notifications
from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.core.serializers.json import DjangoJSONEncoder
from django.http import HttpResponse
from django.shortcuts import render, redirect
from requests import HTTPError
import json
import logging



logger = logging.getLogger(__name__)

@login_required
def index(request):
    context = {}
    token_key = getattr(settings, 'AGAVE_TOKEN_SESSION_ID')
    if token_key in request.session:
        context['session'] = {
            'agave': json.dumps(request.session[token_key])
        }
    context['unreadNotifications'] = get_number_unread_notifications(request)
    return render(request, 'designsafe/apps/applications/index.html', context)


def _app_license_type(app_id):
    app_lic_type = app_id.split('-')[0].upper()
    lic_type = next((t[0] for t in LICENSE_TYPES if t[0] == app_lic_type), None)
    return lic_type

@login_required
def call_api(request, service):
    try:
        token = request.user.agave_oauth
        agave = Agave(api_server=settings.AGAVE_TENANT_BASEURL, token=token.access_token)
        if service == 'apps':
            app_id = request.GET.get('app_id')
            if request.method == 'GET':
                if app_id:
                    data = agave.apps.get(appId=app_id)
                    lic_type = _app_license_type(app_id)
                    data['license'] = {
                        'type': lic_type
                    }
                    if lic_type is not None:
                        lic = request.user.licenses.filter(license_type=lic_type).first()
                        data['license']['enabled'] = lic is not None
            elif request.method == 'POST':
                body = json.loads(request.body)
                data = agave.apps.add(body=body)
            elif request.method == 'DELETE':
                if app_id:
                    data = agave.apps.delete(appId=app_id)

        elif service == 'systems':
            system_id = request.GET.get('system_id')
            public = request.GET.get('public')
            type = request.GET.get('type')

            if request.method == 'GET':
                if system_id:
                    data = agave.systems.get(systemId=system_id)
                else:
                    if (public):
                        if (type):
                            data = agave.systems.list(public=public, type=type)
                        else:
                            data = agave.systems.list(public=public)
                    else:
                        if (type):
                            data = agave.systems.list(type=type)
                        else:
                            data = agave.systems.list()

        elif service == 'meta':
            app_id = request.GET.get('app_id')
            if request.method == 'GET':
                if app_id:
                    data = agave.meta.get(appId=app_id)
                    lic_type = _app_license_type(app_id)
                    data['license'] = {
                        'type': lic_type
                    }
                    if lic_type is not None:
                        lic = request.user.licenses.filter(license_type=lic_type).first()
                        data['license']['enabled'] = lic is not None

                else:
                    query = request.GET.get('q')
                    data = agave.meta.listMetadata(q=query)
            elif request.method == 'POST':
                body = json.loads(request.body)
                if body.has_key('uuid'):
                    uuid = body['uuid']
                    del body['uuid']
                    data = agave.meta.updateMetadata(body=body, uuid=uuid)
                else:
                    data = agave.meta.addMetadata(body=body)

            elif request.method == 'DELETE':
                meta_uuid = request.GET.get('uuid')
                if meta_uuid:
                    data = agave.meta.deleteMetadata(uuid=meta_uuid)

        else:
            return HttpResponse('Unexpected service: %s' % service, status=400)
    except HTTPError as e:
        logger.error('Failed to execute {0} API call due to HTTPError={1}'.format(
            service, e.message))
        return HttpResponse(json.dumps(e.message),
                            content_type='application/json',
                            status=400)
    except AgaveException as e:
        logger.error('Failed to execute {0} API call due to AgaveException={1}'.format(
            service, e.message))
        return HttpResponse(json.dumps(e.message), content_type='application/json',
                            status=400)
    except Exception as e:
        logger.error('Failed to execute {0} API call due to Exception={1}'.format(
            service, e.message))
        return HttpResponse(
            json.dumps({'status': 'error', 'message': '{}'.format(e.message)}),
            content_type='application/json', status=400)

    return HttpResponse(json.dumps(data, cls=DjangoJSONEncoder),
                        content_type='application/json')

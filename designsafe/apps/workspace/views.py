from agavepy.agave import Agave, AgaveException
from celery.result import AsyncResult
from django.shortcuts import render, render_to_response
from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.core.serializers.json import DjangoJSONEncoder
from django.http import HttpResponse, JsonResponse

import logging
import json

import os

from designsafe.apps.workspace.tasks import submit_job
from designsafe.apps.notifications.views import get_number_unread_notifications

logger = logging.getLogger(__name__)

# Create your views here.
@login_required
def index(request):
    context = {}
    token_key = getattr(settings, 'AGAVE_TOKEN_SESSION_ID')
    if token_key in request.session:
        context['session'] = {
            'agave': json.dumps(request.session[token_key])
        }
    context['unreadNotifications'] = get_number_unread_notifications(request)
    return render(request, 'designsafe/apps/workspace/index.html', context)

@login_required
def call_api(request, service):
    task_id = ''
    token = request.user.agave_oauth.token
    access_token = token.get('access_token', None)
    server = os.environ.get('AGAVE_TENANT_BASEURL')

    try:
        agave = Agave(api_server=server, token=access_token)
        if service == 'apps':
            app_id = request.GET.get('app_id')
            if app_id:
                data = agave.apps.get(appId=app_id)
            else:
                publicOnly = request.GET.get('publicOnly')
                if publicOnly == 'true':
                    data = agave.apps.list(publicOnly='true')
                else:
                    data = agave.apps.list()

        elif service == 'files':
            system_id = request.GET.get('system_id')
            file_path = request.GET.get('file_path')
            data = agave.files.list(systemId=system_id, filePath=file_path)

        elif service == 'jobs':
            job_id = request.GET.get('job_id')
            if job_id:
                data = agave.jobs.get(jobId=job_id)
            else:
                if request.method == 'POST':
                    job_post = json.loads(request.body)
                    # data = agave.jobs.submit(body=job_post)
                    # data = submit_job.delay(server, access_token, job_post)
                    data = submit_job(request, agave, job_post)
                    task_id=data.id
                else:
                    data = agave.jobs.list()

        else:
            return HttpResponse('Unexpected service: %s' % service, status=400)
    except AgaveException as ae:
        return HttpResponse(json.dumps(ae.message), status=400,
            content_type='application/json')
    except Exception as e:
        return HttpResponse(
            json.dumps({'status': 'error', 'message': '{}'.format(e.message)}), status=400,
            content_type='application/json')

    return HttpResponse(json.dumps(data, cls=DjangoJSONEncoder),
        content_type='application/json')

@login_required
def interactive(request):
    logger.info('interactive view called');
    context = {}
    token_key = getattr(settings, 'AGAVE_TOKEN_SESSION_ID')
    if token_key in request.session:
        context['session'] = {
            'agave': json.dumps(request.session[token_key])
        }

    logger.info('request is: '.format(request))
    #context['unreadNotifications'] = get_number_unread_notifications(request)
    return render(request, 'designsafe/apps/workspace/vnc-desktop.html', context)

@login_required
def interactive2(request):
    logger.info('interactive view called');
    context = {}
    token_key = getattr(settings, 'AGAVE_TOKEN_SESSION_ID')
    if token_key in request.session:
        context['session'] = {
            'agave': json.dumps(request.session[token_key])
        }

    logger.info('request is: '.format(request))
    #context['unreadNotifications'] = get_number_unread_notifications(request)
    return render(request, 'designsafe/apps/workspace/vnc-desktop2.html', context)

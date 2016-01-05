from agavepy.agave import Agave, AgaveException
from django.shortcuts import render, render_to_response
from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.core.serializers.json import DjangoJSONEncoder
from django.http import JsonResponse

import logging
import json

import os
from agavepy.agave import Agave
from django.http import HttpResponse

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
    return render(request, 'designsafe/apps/workspace/index.html', context)

@login_required
def call_api(request, service):
    token = request.session.get(getattr(settings, 'AGAVE_TOKEN_SESSION_ID'))
    access_token = token.get('access_token', None)
    server = os.environ.get('AGAVE_TENANT_BASEURL')
    agave = Agave(api_server=server, token=access_token)

    response = HttpResponse()
    if service == 'apps':
        app_id = request.GET.get('app_id')
        if app_id:
            data = agave.apps.get(appId=app_id)
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
                logger.debug(job_post)
                try:
                    data = agave.jobs.submit(body=job_post)
                except AgaveException as ae:
                    return HttpResponse(json.dumps(ae.message), status=400,
                        content_type='application/json')
                except Exception as e:
                    return HttpResponse(
                        json.dumps({'status': 'error', 'message': e.message}), status=400,
                        content_type='application/json')
            else:
                data = agave.jobs.list()

    else:
        return HttpResponse('Unexpected service: %s' % service, status=400)

    return HttpResponse(json.dumps(data, cls=DjangoJSONEncoder),
        content_type='application/json')
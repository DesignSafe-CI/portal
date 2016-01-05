from agavepy.agave import Agave
from django.shortcuts import render, render_to_response
from django.conf import settings
from django.contrib.auth.decorators import login_required

import logging
import json

import os
from agavepy.agave import Agave
from django.http import HttpResponse
# import dateutil.parser
# from bson import Binary, Code
#from bson import dumps

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
def get_template(request, resource):
    """
      Returns a template.
    """
    #TODO: Should be replaced by TemplateView(template='template') or a subclass of that.
    #TODO: Should use login_required?
    logger.info('Template requested: {0}.html'.format(resource))
    templateUrl = 'designsafe/apps/workspace/{0}.html'.format(resource)
    return render_to_response(templateUrl)

def apps_list(request):
    token = request.session.get(getattr(settings, 'AGAVE_TOKEN_SESSION_ID'))
    access_token = token.get('access_token', None)
    server = os.environ.get('AGAVE_TENANT_BASEURL')
    agave = Agave(api_server=server, token=access_token)
    app_list = agave.apps.list()
    logger.info(app_list)
    for app in app_list:
        app['lastModified'] = app['lastModified'].strftime('%Y-%m-%d %H:%M:%S')

    return HttpResponse(json.dumps(app_list), content_type="application/json")

def files_list(request):
    token = request.session.get(getattr(settings, 'AGAVE_TOKEN_SESSION_ID'))
    access_token = token.get('access_token', None)
    server = os.environ.get('AGAVE_TENANT_BASEURL')
    agave = Agave(api_server=server, token=access_token)
    system_id = os.environ.get('AGAVE_STORAGE_SYSTEM')
    file_list = agave.files.list(systemId=system_id, filePath='mrojas')

    # serialize dates
    for file in file_list:
        file['lastModified'] = file['lastModified'].strftime('%Y-%m-%d %H:%M:%S')

    return HttpResponse(json.dumps(file_list), content_type="application/json")

def jobs_list(request):
    token = request.session.get(getattr(settings, 'AGAVE_TOKEN_SESSION_ID'))
    access_token = token.get('access_token', None)
    server = os.environ.get('AGAVE_TENANT_BASEURL')
    agave = Agave(api_server=server, token=access_token)
    job_list = agave.jobs.list()
    for job in job_list:
        job['endTime'] = job['endTime'].strftime('%Y-%m-%d %H:%M:%S')
        job['startTime'] = job['startTime'].strftime('%Y-%m-%d %H:%M:%S') if job['startTime'] is not None else ''

    return HttpResponse(json.dumps(job_list), content_type="application/json")

def jobs_details(request):
    token = request.session.get(getattr(settings, 'AGAVE_TOKEN_SESSION_ID'))
    access_token = token.get('access_token', None)
    server = os.environ.get('AGAVE_TENANT_BASEURL')
    agave = Agave(api_server=server, token=access_token)
    request_data = json.loads(request.body)

    job_details = agave.jobs.get(jobId=request_data['id'])
    job_details['endTime'] = job_details['endTime'].strftime('%Y-%m-%d %H:%M:%S')
    job_details['submitTime'] = job_details['submitTime'].strftime('%Y-%m-%d %H:%M:%S')
    job_details['startTime'] = job_details['startTime'].strftime('%Y-%m-%d %H:%M:%S') if job_details['startTime'] is not None else ''

    return HttpResponse(json.dumps(job_details), content_type="application/json")

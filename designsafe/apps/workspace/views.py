from agavepy.agave import Agave, AgaveException
from django.shortcuts import render
from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.core.serializers.json import DjangoJSONEncoder
from django.http import HttpResponse
from designsafe.apps.workspace.tasks import submit_job
from designsafe.apps.notifications.views import get_number_unread_notifications
from urlparse import urlparse
import json
import os
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
            file_path = request.GET.get('file_path', '')
            if (system_id == 'designsafe.storage.default' and
                    not file_path.startswith(request.user.username)):
                file_path = '%s/%s' % (request.user.username, file_path)
            logger.debug('Listing "agave://%s/%s"...' % (system_id, file_path))
            data = agave.files.list(systemId=system_id, filePath=file_path)

        elif service == 'jobs':
            job_id = request.GET.get('job_id')
            if job_id:
                data = agave.jobs.get(jobId=job_id)
            else:
                if request.method == 'POST':
                    job_post = json.loads(request.body)

                    # parse agave:// URI into "archiveSystem" and "archivePath"
                    if job_post['archivePath'].startswith('agave://'):
                        parsed = urlparse(job_post['archivePath'])
                        # strip leading slash
                        job_post['archivePath'] = parsed.path[1:]
                        job_post['archiveSystem'] = parsed.netloc

                    data = submit_job(request, agave, job_post)
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

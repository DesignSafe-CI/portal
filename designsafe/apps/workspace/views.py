from agavepy.agave import Agave, AgaveException
from django.shortcuts import render
from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.core.serializers.json import DjangoJSONEncoder
from django.core.urlresolvers import reverse
from django.http import HttpResponse
from designsafe.apps.workspace.tasks import submit_job
from designsafe.apps.notifications.views import get_number_unread_notifications
from dsapi.agave.daos import FileManager, shared_with_me
from urlparse import urlparse
import json
import os
import six
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
                public_only = request.GET.get('publicOnly')
                if public_only == 'true':
                    data = agave.apps.list(publicOnly='true')
                else:
                    data = agave.apps.list()

        elif service == 'files':
            system_id = request.GET.get('system_id')
            file_path = request.GET.get('file_path', '')
            special_dir = None
            if system_id == 'designsafe.storage.default':
                if shared_with_me in file_path:
                    special_dir = shared_with_me
                    file_path = '/'.join(file_path.split('/')[2:])

                elif file_path == '':
                    file_path = request.user.username

            file_path = file_path.strip('/')

            if file_path == '':
                file_path = '/'

            logger.debug('Listing "agave://%s/%s"...' % (system_id, file_path))

            # Agave Files call
            # data = agave.files.list(systemId=system_id, filePath=file_path)

            # ElasticSearch call
            try:
                fm = FileManager(agave)
                listing = fm.list_path(system_id=system_id,
                                       path=file_path,
                                       username=request.user.username,
                                       special_dir=special_dir,
                                       is_public=system_id == 'nees.public'
                                       )
                data = [f.to_dict() for f in listing]

                # TODO type of "Shared with me" should be "dir" not "folder"
                for d in data:
                    d.update((k, 'dir') for k, v in six.iteritems(d)
                             if k == 'type' and v == 'folder')

                if special_dir:
                    data = [{
                        'name': '.',
                        'path': special_dir + file_path.strip('/'),
                        'systemId': system_id,
                        'type': 'dir',
                    }] + data
                elif file_path != request.user.username:
                    data = [{
                        'name': '.',
                        'path': file_path,
                        'systemId': system_id,
                        'type': 'dir',
                    }] + data
            except:
                data = []

        elif service == 'jobs':
            if request.method == 'DELETE':
                job_id = request.GET.get('job_id')
                data = []
                data = agave.jobs.delete(jobId=job_id)
            elif request.method == 'POST':
                job_post = json.loads(request.body)
                job_id = job_post.get('job_id')
                if job_id: #cancel job / stop job
                    data = agave.jobs.manage(jobId=job_id, body='{"action":"stop"}')
                elif job_post: #submit job
                    # parse agave:// URI into "archiveSystem" and "archivePath"
                    if ('archivePath' in job_post and
                            job_post['archivePath'].startswith('agave://')):
                        parsed = urlparse(job_post['archivePath'])
                        # strip leading slash
                        job_post['archivePath'] = parsed.path[1:]
                        job_post['archiveSystem'] = parsed.netloc

                    data = submit_job(request, agave, job_post)

                else: #list jobs
                    data = agave.jobs.list()

            elif request.method == 'GET':
                #get specific job info
                job_id = request.GET.get('job_id')
                if job_id:
                    data = agave.jobs.get(jobId=job_id)
                    db_hash = data['archivePath'].replace(data['owner'], '')
                    data['archiveUrl'] = '%s#%s' % (reverse('designsafe_data:my_data'), db_hash)
                else:
                    data = agave.jobs.list()
            else:
                return HttpResponse('Unexpected service: %s' % service, status=400)

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
def interactive2(request, hostname, port, password):
    context = {}
    token_key = getattr(settings, 'AGAVE_TOKEN_SESSION_ID')
    if token_key in request.session:
        context['session'] = {
            'agave': json.dumps(request.session[token_key])
        }

    return render(request, 'designsafe/apps/workspace/vnc-desktop2.html', context)

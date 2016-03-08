from agavepy.agave import Agave, AgaveException
from django.shortcuts import render
from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.core.serializers.json import DjangoJSONEncoder
from django.core.urlresolvers import reverse
from django.http import HttpResponse
from designsafe.apps.workspace.tasks import JobSubmitError, submit_job
from designsafe.apps.notifications.views import get_number_unread_notifications
from designsafe.apps.licenses.models import LICENSE_TYPES
from dsapi.agave.daos import FileManager, shared_with_me
from requests import HTTPError
from urlparse import urlparse
from datetime import datetime
import json
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
    try:
        token = request.user.agave_oauth
        agave = Agave(api_server=settings.AGAVE_TENANT_BASEURL, token=token.access_token)
        if service == 'apps':
            app_id = request.GET.get('app_id')
            if app_id:
                data = agave.apps.get(appId=app_id)
                app_lic_type = app_id.split('-')[0].upper()
                lic_type = next((t[0] for t in LICENSE_TYPES
                                        if t[0] == app_lic_type), None)
                data['license'] = {'type': lic_type}
                if lic_type is not None:
                    lic = next((l for l in request.user.licenses.all()
                                if l.license_type == lic_type), None)
                    data['license']['enabled'] = lic is not None

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

                # filter out empty projects
                if system_id == 'nees.public' and file_path == '/':
                    data = [f for f in data if 'projecTitle' in f and
                            not f['projecTitle'].startswith('EMPTY PROJECT')]

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
                data = agave.jobs.delete(jobId=job_id)
            elif request.method == 'POST':
                job_post = json.loads(request.body)
                job_id = job_post.get('job_id')

                # cancel job / stop job
                if job_id:
                    data = agave.jobs.manage(jobId=job_id, body='{"action":"stop"}')

                # submit job
                elif job_post:
                    if 'archivePath' in job_post:
                        archive_path = job_post['archivePath']
                        # parse agave:// URI into "archiveSystem" and "archivePath"
                        if archive_path.startswith('agave://'):
                            parsed = urlparse(archive_path)
                            # strip leading slash
                            job_post['archivePath'] = parsed.path[1:]
                            job_post['archiveSystem'] = parsed.netloc
                        elif not archive_path.startswith(request.user.username):
                            archive_path = '%s/%s' % (
                                request.user.username, archive_path)
                            job_post['archivePath'] = archive_path
                    else:
                        job_post['archivePath'] = \
                            '%s/archive/jobs/%s/${JOB_NAME}-${JOB_ID}' % (
                                request.user.username,
                                datetime.now().strftime('%Y-%m-%d'))

                    try:
                        data = submit_job(request, request.user.username, job_post)
                    except JobSubmitError as e:
                        data = e.json()
                        logger.debug(data)
                        return HttpResponse(json.dumps(data),
                                            content_type='application/json',
                                            status=e.status_code)

                # list jobs (via POST?)
                else:
                    limit = request.GET.get('limit', 10)
                    offset = request.GET.get('offset', 0)
                    data = agave.jobs.list(limit=limit, offset=offset)

            elif request.method == 'GET':
                job_id = request.GET.get('job_id')

                # get specific job info
                if job_id:
                    data = agave.jobs.get(jobId=job_id)
                    q = {"associationIds": job_id }
                    job_meta = agave.meta.listMetadata(q=json.dumps(q))
                    if job_meta:
                        data['_embedded'] = {"metadata": job_meta}
                    db_hash = data['archivePath'].replace(data['owner'], '')
                    data['archiveUrl'] = '%s#%s' % (reverse('designsafe_data:my_data'), db_hash)

                # list jobs
                else:
                    limit = request.GET.get('limit', 10)
                    offset = request.GET.get('offset', 0)
                    data = agave.jobs.list(limit=limit, offset=offset)
            else:
                return HttpResponse('Unexpected service: %s' % service, status=400)

        else:
            return HttpResponse('Unexpected service: %s' % service, status=400)
    except HTTPError as e:
        return HttpResponse(json.dumps(e.response),
                            content_type='application/json',
                            status=400)
    except AgaveException as e:
        return HttpResponse(json.dumps(e.message), content_type='application/json',
                            status=400)
    except Exception as e:
        return HttpResponse(
            json.dumps({'status': 'error', 'message': '{}'.format(e.message)}),
            content_type='application/json', status=400)

    return HttpResponse(json.dumps(data, cls=DjangoJSONEncoder),
                        content_type='application/json')

@login_required
def interactive2(request, hostname, port, password):
    context = {}
    token = request.user.agave_oauth
    context['session'] = {
        'agave': json.dumps(token.token)
    }

    return render(request, 'designsafe/apps/workspace/vnc-desktop2.html', context)

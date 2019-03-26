from agavepy.agave import AgaveException, Agave
from django.shortcuts import render, redirect
from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.core.serializers.json import DjangoJSONEncoder
from django.core.urlresolvers import reverse
from django.core.exceptions import ObjectDoesNotExist
from django.http import HttpResponse
from designsafe.apps.api.notifications.models import Notification
from designsafe.apps.workspace.tasks import JobSubmitError, submit_job
from designsafe.apps.licenses.models import LICENSE_TYPES, get_license_info
from designsafe.libs.common.decorators import profile as profile_fn
from designsafe.apps.api.tasks import index_or_update_project
from designsafe.apps.workspace import utils as WorkspaceUtils
from designsafe.apps.workspace.models.app_descriptions import AppDescription
from requests import HTTPError
from urlparse import urlparse
from datetime import datetime
import json
import six
import logging
import urllib

logger = logging.getLogger(__name__)

@login_required
def index(request):
    context = {
    }
    return render(request, 'designsafe/apps/workspace/index.html', context)


def _app_license_type(app_id):
    app_lic_type = app_id.replace('-{}'.format(app_id.split('-')[-1]), '').upper()
    lic_type = next((t for t in LICENSE_TYPES if t in app_lic_type), None)
    return lic_type


@profile_fn
@login_required
def call_api(request, service):
    try:
        agave = request.user.agave_oauth.client
        if service == 'apps':
            app_id = request.GET.get('app_id')
            if app_id:
                data = agave.apps.get(appId=app_id)
                lic_type = _app_license_type(app_id)
                data['license'] = {
                    'type': lic_type
                }
                if lic_type is not None:
                    _, license_models = get_license_info()
                    license_model = filter(lambda x: x.license_type == lic_type, license_models)[0]
                    lic = license_model.objects.filter(user=request.user).first()
                    data['license']['enabled'] = lic is not None

            else:

                public_only = request.GET.get('publicOnly')
                if public_only == 'true':
                    data = agave.apps.list(publicOnly='true')
                else:
                    data = agave.apps.list()

        elif service == 'monitors':
            target = request.GET.get('target')
            ds_admin_client = Agave(api_server=getattr(settings, 'AGAVE_TENANT_BASEURL'), token=getattr(settings, 'AGAVE_SUPER_TOKEN'))
            data = ds_admin_client.monitors.list(target=target)

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
                        _, license_models = get_license_info()
                        license_model = filter(lambda x: x.license_type == lic_type, license_models)[0]
                        lic = license_model.objects.filter(user=request.user).first()
                        data['license']['enabled'] = lic is not None

                else:
                    query = request.GET.get('q')
                    data = agave.meta.listMetadata(q=query)
            elif request.method == 'POST':
                meta_post = json.loads(request.body)
                meta_uuid = meta_post.get('uuid')

                if meta_uuid:
                    del meta_post['uuid']
                    data = agave.meta.updateMetadata(uuid=meta_uuid, body=meta_post)
                    index_or_update_project.apply_async(args=[meta_uuid], queue='api')
                else:
                    data = agave.meta.addMetadata(body=meta_post)
            elif request.method == 'DELETE':
                meta_uuid = request.GET.get('uuid')
                if meta_uuid:
                    data = agave.meta.deleteMetadata(uuid=meta_uuid)


        # TODO: Need auth on this DELETE business
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

                    # cleaning archive path value
                    if 'archivePath' in job_post:
                        parsed = urlparse(job_post['archivePath'])
                        if parsed.path.startswith('/'):
                            # strip leading '/'
                            archive_path = parsed.path[1:]
                        else:
                            archive_path = parsed.path

                        if not archive_path.startswith(request.user.username):
                            archive_path = '{}/{}'.format(
                                request.user.username, archive_path)

                        job_post['archivePath'] = archive_path

                        if parsed.netloc:
                            job_post['archiveSystem'] = parsed.netloc
                    else:
                        job_post['archivePath'] = \
                            '{}/archive/jobs/{}/${{JOB_NAME}}-${{JOB_ID}}'.format(
                                request.user.username,
                                datetime.now().strftime('%Y-%m-%d'))

                    # check for running licensed apps
                    lic_type = _app_license_type(job_post['appId'])
                    if lic_type is not None:
                        _, license_models = get_license_info()
                        license_model = filter(lambda x: x.license_type == lic_type, license_models)[0]
                        lic = license_model.objects.filter(user=request.user).first()
                        job_post['parameters']['_license'] = lic.license_as_str()

                    # url encode inputs
                    if job_post['inputs']:
                        for key, value in six.iteritems(job_post['inputs']):
                            if type(value) == list:
                                inputs = []
                                for val in value:
                                    parsed = urlparse(val)
                                    if parsed.scheme:
                                        inputs.append('{}://{}{}'.format(
                                            parsed.scheme, parsed.netloc, urllib.quote(parsed.path)))
                                    else:
                                        inputs.append(urllib.quote(parsed.path))
                                job_post['inputs'][key] = inputs
                            else:
                                parsed = urlparse(value)
                                if parsed.scheme:
                                    job_post['inputs'][key] = '{}://{}{}'.format(
                                        parsed.scheme, parsed.netloc, urllib.quote(parsed.path))
                                else:
                                    job_post['inputs'][key] = urllib.quote(parsed.path)

                    if settings.DEBUG:
                        wh_base_url = settings.WEBHOOK_POST_URL.strip('/') + '/webhooks/'
                        jobs_wh_url = settings.WEBHOOK_POST_URL + reverse('designsafe_api:jobs_wh_handler')
                    else:
                        wh_base_url = request.build_absolute_uri('/webhooks/')
                        jobs_wh_url = request.build_absolute_uri(reverse('designsafe_api:jobs_wh_handler'))

                    # Remove any params from job_post that are not in appDef
                    for param, _ in job_post['parameters'].items():
                        if not any(p['id'] == param for p in job_post['appDefinition']['parameters']):
                            del job_post['parameters'][param]

                    job_post['notifications'] = [
                        {'url': jobs_wh_url,
                        'event': e}
                        for e in ["PENDING", "QUEUED", "SUBMITTING", "PROCESSING_INPUTS", "STAGED", "RUNNING", "KILLED", "FAILED", "STOPPED", "FINISHED"]]

                    try:
                        data = submit_job(request, request.user.username, job_post)
                    except JobSubmitError as e:
                        data = e.json()
                        logger.error('Failed to submit job {0}'.format(data))
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
                    q = {"associationIds": job_id}
                    job_meta = agave.meta.listMetadata(q=json.dumps(q))
                    data['_embedded'] = {"metadata": job_meta}

                    archive_system_path = '{}/{}'.format(data['archiveSystem'],
                                                         data['archivePath'])
                    data['archiveUrl'] = reverse(
                        'designsafe_data:data_depot')
                    data['archiveUrl'] += 'agave/{}/'.format(archive_system_path)

                # list jobs
                else:
                    limit = request.GET.get('limit', 10)
                    offset = request.GET.get('offset', 0)
                    data = agave.jobs.list(limit=limit, offset=offset)
            else:
                return HttpResponse('Unexpected service: %s' % service, status=400)

        elif service == 'ipynb':
            put = json.loads(request.body)
            dir_path = put.get('file_path')
            system = put.get('system')
            data = WorkspaceUtils.setup_identity_file(
                request.user.username,
                agave,
                system,
                dir_path
            )
        elif service == 'description':
            app_id = request.GET.get('app_id')
            try:
                data = AppDescription.objects.get(appId=app_id).desc_to_dict()
            except ObjectDoesNotExist:
                return HttpResponse('No description found for {}'.format(app_id), status=200)
        else:
            return HttpResponse('Unexpected service: %s' % service, status=400)
    except HTTPError as e:
        logger.exception(
            'Failed to execute %s API call due to HTTPError=%s\n%s',
            service,
            e.message,
            e.response.content
        )
        return HttpResponse(json.dumps(e.message),
                            content_type='application/json',
                            status=400)
    except AgaveException as e:
        logger.exception('Failed to execute {0} API call due to AgaveException={1}'.format(
            service, e.message))
        return HttpResponse(json.dumps(e.message), content_type='application/json',
                            status=400)
    except Exception as e:
        logger.exception('Failed to execute {0} API call due to Exception={1}'.format(
            service, e))
        return HttpResponse(
            json.dumps({'status': 'error', 'message': '{}'.format(e.message)}),
            content_type='application/json', status=400)

    return HttpResponse(json.dumps(data, cls=DjangoJSONEncoder),
                        content_type='application/json')


def process_notification(request, pk, **kwargs):
    n = Notification.objects.get(pk=pk)
    extra = n.extra_content
    logger.info('extra: {}'.format(extra))
    archiveSystem = extra['archiveSystem']
    archivePath = extra['archivePath']

    archive_id = '%s/%s' % (archiveSystem, archivePath)

    target_path = reverse('designsafe_data:data_depot') + 'agave/' + archive_id + '/'

    return redirect(target_path)

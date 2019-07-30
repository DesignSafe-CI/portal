import json
import logging
from itertools import chain
from django.core import serializers
from django.http import HttpResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.contrib.auth import get_user_model
from agavepy.agave import AgaveException
from requests import HTTPError
from designsafe.apps.api.notifications.models import Notification
from designsafe.apps.notifications.models import Notification as LegacyNotification
from designsafe.apps.api.exceptions import ApiException


LOGGER = logging.getLogger(__name__)


def index(request):
    return render(request, 'designsafe/apps/notifications/index.html')


@require_POST
@csrf_exempt
def generic_webhook_handler(request):
    event_type = request.POST.get('event_type', None)
    if event_type == 'WEB':
        # This is for jobs that just point to a URL that gets created
        # like the Potree Viewer Application or DCV-based apps
        job_owner = request.POST.get('owner', '')
        address = request.POST.get('address', '')
        job_uuid = request.POST.get('job_uuid', '')
        event_data = {
            Notification.EVENT_TYPE: event_type,
            Notification.STATUS: Notification.INFO,
            Notification.OPERATION: 'web_link',
            Notification.USER: job_owner,
            Notification.MESSAGE: 'Ready to view.',
            Notification.ACTION_LINK: address,
            Notification.EXTRA: {
                'address': address,
                'target_uri': address
            }
        }
    elif event_type == 'VNC':
        job_owner = request.POST.get('owner', '')
        host = request.POST.get('host', '')
        port = request.POST.get('port', '')
        password = request.POST.get('password', '')
        address = request.POST.get('address', '')
        job_uuid = password

        if host == 'designsafe-exec-01.tacc.utexas.edu':
            target_uri = 'https://' + address + '&autoconnect=true'
        else:
            # target_uri = \
            #     'https://vis.tacc.utexas.edu/no-vnc/vnc.html?' \
            #     'hostname=%s&port=%s&autoconnect=true&password=%s' % (host, port, password)
            target_uri = \
                'https://{host}/no-vnc/vnc.html?'\
                'hostname={host}&port={port}&autoconnect=true&password={pw}' \
                .format(host=host, port=port, pw=password)
        event_data = {
            Notification.EVENT_TYPE: event_type,
            Notification.STATUS: Notification.INFO,
            Notification.OPERATION: 'web_link',
            Notification.USER: job_owner,
            Notification.MESSAGE: 'Your VNC session is ready.',
            Notification.ACTION_LINK: target_uri,
            Notification.EXTRA: {
                'host': host,
                'port': port,
                'address': address,
                'password': password,
                'target_uri': target_uri,
                'associationIds': job_uuid
            }
        }

    else:
        return HttpResponse('Unexpected event_type', status=400)

    # confirm that there is a corresponding running agave job before sending notification
    try:
        user = get_user_model().objects.get(username=job_owner)
        agave = user.agave_oauth.client
        job_data = agave.jobs.get(jobId=job_uuid)
        if job_data['owner'] != job_owner or job_data["status"] in ['FINISHED', 'FAILED', 'STOPPED']:
            LOGGER.error(
                "Agave job (owner='{}', status='{}) for this event (owner='{}') is not valid".format(job_data['owner'],
                                                                                                     job_data['status'],
                                                                                                     job_owner))
            raise ApiException(
                "Unable to find a related valid job for this interactive event.")
    except (HTTPError, AgaveException, ApiException) as e:
        LOGGER.exception(
            "Could not find valid corresponding Agave job for interactive event")
        return HttpResponse(json.dumps(e.message), content_type='application/json', status=400)

    n = Notification.objects.create(**event_data)
    n.save()

    # create metadata for Interactive connection and save to agave metadata
    try:
        agave_job_meta = {
            'name': 'interactiveJobDetails',
            'value': event_data,
            'associationIds': [job_uuid],
        }
        user = get_user_model().objects.get(username=job_owner)
        agave = user.agave_oauth.client
        agave.meta.addMetadata(body=json.dumps(agave_job_meta))

    except (HTTPError, AgaveException) as e:
        LOGGER.exception('Could not add interactive connection data to metadata')
        return HttpResponse(json.dumps(e.message), content_type='application/json', status=400)

    return HttpResponse('OK')


def get_number_unread_notifications(request):
    # nondeleted = JobNotification.objects.filter(deleted=False, user=str(request.user)).count()
    unread = Notification.objects.filter(deleted=False, read=False, user=str(request.user)).count()
    # LOGGER.info('nondeleted: {}'.format(nondeleted))
    LOGGER.info('unread: {}'.format(unread))
    return unread


def notifications(request):
    items = Notification.objects.filter(
        deleted=False,
        user=str(request.user)).order_by('-datetime')
    legacy_items = LegacyNotification.objects.filter(
        deleted=False,
        user=str(request.user)).order_by('-notification_time')
    unread = 0
    for i in items:
        if not i.read:
            unread += 1
            i.mark_read()
    items = list(chain(items, legacy_items))
    try:
        items = serializers.serialize('json', items)
    except TypeError:
        items = []
    return HttpResponse(items, content_type='application/json')


def delete_notification(request):
    body = json.loads(request.body)
    pk = body['pk']
    LOGGER.info('pk: {}'.format(pk))
    if pk == 'all':
        items = Notification.objects.filter(deleted=False, user=str(request.user))
        for i in items:
            i.mark_deleted()
    else:
        x = Notification.objects.get(pk=pk)
        x.mark_deleted()

    return HttpResponse('OK')

from designsafe.apps.api.notifications.models import Notification
from designsafe.apps.notifications.models import Notification as LegacyNotification
from designsafe.apps.signals.signals import generic_event

from django.core import serializers
from django.http import HttpResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from agavepy.agave import AgaveException
from requests import HTTPError
from django.contrib.auth import get_user_model

from itertools import chain

import json
import logging


logger = logging.getLogger(__name__)


def index(request):
    return render(request, 'designsafe/apps/notifications/index.html')


@require_POST
@csrf_exempt
def generic_webhook_handler(request):
    event_type = request.POST.get('event_type', None)
    if event_type == 'WEB':
        # This is for jobs that just point to a URL that gets created
        # like the Potree Viewer Application
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
                'target_uri': address,
            }
        }
        n = Notification.objects.create(**event_data)
        n.save()
    elif event_type == 'VNC':
        job_owner = request.POST.get('owner', '')
        host = request.POST.get('host', '')
        port = request.POST.get('port', '')
        password = request.POST.get('password', '')
        address = request.POST.get('address', '')
        job_uuid = password

        if(host == 'designsafe-exec-01.tacc.utexas.edu'):
            target_uri = 'https://' + address + '&port=%s&autoconnect=true' % (port)
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
            Notification.OPERATION: 'vnc_session_start',
            Notification.USER: job_owner,
            Notification.MESSAGE: 'Your VNC session is ready.',
            Notification.ACTION_LINK: target_uri,
            Notification.EXTRA: {
                'host': host,
                'port': port,
                'address': address,
                'password': password,
                'associationIds': job_uuid,
                'target_uri': target_uri
            }
        }
        n = Notification.objects.create(**event_data)
        n.save()
    else:
        return HttpResponse('Unexpected', status=400)

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
        logger.exception('Could not add interactive connection data to metadata')
        return HttpResponse(json.dumps(e.message), content_type='application/json', status=400)

    return HttpResponse('OK')


@require_POST
@csrf_exempt
def job_notification_handler(request):
    JOB_EVENT = 'job'
    logger.debug('request body: {}'.format(request.body))

    try:
        notification = json.loads(request.body)
        logger.info('notification body: {}'.format(notification))
        logger.info('notification name: {}'.format(notification['name']))
        job_name = notification['name']
        status = notification['status']
        event = request.GET.get('event')
        job_id = request.GET.get('job_id')
        job_owner = notification['owner']
        archive_path = notification['archivePath']
    except ValueError as e:  # for testing ->used when mocking agave notification
        job_name = request.POST.get('job_name')
        status = request.POST.get('status')
        event = request.POST.get('event')
        job_id = request.POST.get('job_id')
        job_owner = request.POST.get('job_owner')
        archive_path = request.POST.get('archivePath')

    logger.info('job_name: {}'.format(job_name))
    logger.info('event: {}'.format(event))
    logger.info('job_id: {}'.format(job_id))

    body = {
        'job_name': job_name,
        'job_id': job_id,
        'event': event,
        'status': status,
        'archive_path': archive_path,
        'job_owner': job_owner,
    }
    generic_event.send_robust(None, event_type='job', event_data=body,
                             event_users=[job_owner])

    return HttpResponse('OK')


def get_number_unread_notifications(request):
    # nondeleted = JobNotification.objects.filter(deleted=False, user=str(request.user)).count()
    unread = Notification.objects.filter(deleted=False, read=False, user=str(request.user)).count()
    # logger.info('nondeleted: {}'.format(nondeleted))
    logger.info('unread: {}'.format(unread))
    return unread


def notifications(request):
    items = Notification.objects.filter(
        deleted=False,
        user=str(request.user)).order_by('-datetime')
    legacy_items = LegacyNotification.objects.filter(
        deleted = False,
        user = str(request.user)).order_by('-notification_time')
    unread = 0
    for i in items:
        if not i.read:
            unread += 1
            i.mark_read()
    items = list(chain(items, legacy_items))
    try:
        items = serializers.serialize('json', items)
    except TypeError as e:
        items=[]
    return HttpResponse(items, content_type='application/json')


def delete_notification(request):
    body = json.loads(request.body)
    pk = body['pk']
    logger.info('pk: {}'.format(pk))
    if pk == 'all':
        items=Notification.objects.filter(deleted=False, user=str(request.user))
        for i in items:
            i.mark_deleted()
    else:
        x = Notification.objects.get(pk=pk)
        x.mark_deleted()

    return HttpResponse('OK')

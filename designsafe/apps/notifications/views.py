# from designsafe.apps.notifications.tasks import send_job_notification
from designsafe.apps.notifications.apps import Event
from designsafe.apps.notifications.models import Notification
from designsafe.apps.signals.signals import generic_event

from django.core.serializers.json import DjangoJSONEncoder
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

import json
import logging

logger = logging.getLogger(__name__)


@require_POST
@csrf_exempt
def generic_webhook_handler(request):
    if request.method == 'POST':
        # do stuff
        event_type = request.POST.get('event_type', None)
    else:
        # do other stuff, to be determined in future webhooks I suppose
        return HttpResponse('Unexpected', status=400)

    if event_type == 'VNC':
        event_type = request.POST.get('event_type', '')
        job_owner = request.POST.get('owner', '')
        host = request.POST.get('host', '')
        port = request.POST.get('port','')
        password = request.POST.get('password','')

        body = {
            'event_type': event_type,
            'job_owner': job_owner,
            'host': host,
            'port': port,
            'password': password,
        }

        generic_event.send_robust('generic_webhook_handler', event_type=event_type, event_data=body)
        return HttpResponse('OK')
    else:
        return HttpResponse('Unexpected', status=400)

@require_POST
@csrf_exempt
def job_notification_handler(request):
    JOB_EVENT='job'
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
    except ValueError as e: #for testing ->used when mocking agave notification
        job_name = request.POST.get('job_name')
        status = request.POST.get('status')
        event = request.POST.get('event')
        job_id = request.POST.get('job_id')
        job_owner = request.POST.get('job_owner')
        archive_path = request.POST.get('archivePath')

    logger.info('job_name: {}'.format(job_name))
    logger.info('event: {}'.format(event))
    logger.info('job_id: {}'.format(job_id))

    # notification = JobNotification(job_name=job_name, job_id=job_id, user=job_owner, event=event, status=status)

    body={
        'job_name': job_name,
        'job_id': job_id,
        'event': event,
        'status': status,
        'archive_path': archive_path,
        'job_owner': job_owner,
    }

    users=[job_owner]

    notification = Notification(event_type=JOB_EVENT, user=job_owner, body=json.dumps(body))
    notification.save()

    Event.send_event(JOB_EVENT, users, body)

    return HttpResponse('OK')

def get_number_unread_notifications(request):
    # nondeleted = JobNotification.objects.filter(deleted=False, user=str(request.user)).count()
    unread = Notification.objects.filter(deleted=False, read=False, user=str(request.user)).count()
    # logger.info('nondeleted: {}'.format(nondeleted))
    logger.info('unread: {}'.format(unread))
    return unread

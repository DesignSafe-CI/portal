# from designsafe.apps.notifications.tasks import send_job_notification
from designsafe.apps.notifications.apps import JobEvent
from designsafe.apps.notifications.models import Notification

from django.core.serializers.json import DjangoJSONEncoder
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

import json
import logging

logger = logging.getLogger(__name__)

@require_POST
@csrf_exempt
def job_notification_handler(request):
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
    except ValueError as e: #for testing ->used when mocking agave notification
        job_name = request.POST.get('job_name')
        status = request.POST.get('status')
        event = request.POST.get('event')
        job_id = request.POST.get('job_id')
        job_owner = request.POST.get('job_owner')

    logger.info('job_name: {}'.format(job_name))
    logger.info('event: {}'.format(event))
    logger.info('job_id: {}'.format(job_id))

    # notification = JobNotification(job_name=job_name, job_id=job_id, user=job_owner, event=event, status=status)

    body={
        'job_name': job_name,
        'job_id': job_id,
        'event': event,
        'status': status
    }

    notification = Notification(event_type='job', user=job_owner, body=body)
    notification.save()

    data = {
        "job_name": job_name,
        "status": status,
        "event": event,
        "job_id": job_id,
        "job_owner": job_owner,
        "body": body,
    }

    JobEvent.send_event(data)

    return HttpResponse(json.dumps(data, cls=DjangoJSONEncoder),
        content_type='application/json')

def get_number_unread_notifications(request):
    # nondeleted = JobNotification.objects.filter(deleted=False, user=str(request.user)).count()
    unread = Notification.objects.filter(deleted=False, read=False, user=str(request.user)).count()
    # logger.info('nondeleted: {}'.format(nondeleted))
    logger.info('unread: {}'.format(unread))
    return unread

# from designsafe.apps.notifications.tasks import send_job_notification
from designsafe.apps.notifications.apps import JobEvent
from designsafe.apps.notifications.models import JobNotification

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
    logger.debug(request.body)
    job_name = request.POST.get('job_name')
    event = request.POST.get('event')
    job_id = request.POST.get('job_id')
    job_owner = request.POST.get('job_owner')

    logger.info('job_name: {}'.format(job_name))
    logger.info('event: {}'.format(event))
    logger.info('job_id: {}'.format(job_id))

    notification = JobNotification(job_name=job_name, job_id=job_id, user=job_owner, event=event)
    notification.save()

    data = {
        "job_name": job_name,
        "event": event,
        "job_id": job_id,
        "job_owner": job_owner,
        "new_notification": True
    }

    JobEvent.send_event(data)

    return HttpResponse(json.dumps(data, cls=DjangoJSONEncoder),
        content_type='application/json')

def get_number_unread_notifications():
    nondeleted = JobNotification.objects.filter(deleted=False).count()
    unread = JobNotification.objects.filter(deleted=False, read=False).count()
    logger.info('nondeleted: {}'.format(nondeleted))
    logger.info('unread: {}'.format(unread))
    return unread

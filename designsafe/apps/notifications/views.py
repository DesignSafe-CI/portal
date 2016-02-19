# from designsafe.apps.notifications.tasks import send_job_notification
from designsafe.apps.notifications.apps import Event
from designsafe.apps.notifications.models import Notification

from django.core import serializers
# from django.core.serializers.json import DjangoJSONEncoder
from django.core.urlresolvers import reverse
from django.http import HttpResponse
from django.shortcuts import render, redirect
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

import json
import logging

logger = logging.getLogger(__name__)

def index(request):
    # items = Notification.objects.filter(
    #     deleted=False, user=str(request.user)).order_by('-notification_time')
    # unread = 0
    # for i in items:
    #     if not i.read:
    #         unread += 1
    #         i.mark_read()
    # logger.info('items: {}'.format(items))
    # items = serializers.serialize('json', items) #json.dumps(items, cls=DjangoJSONEncoder)
    # try:
    #     logger.info('items json dump: {}'.format(items))
    # except TypeError as e:
    #     items=[]
    # logger.info('items end: {}'.format(items))
    # return HttpResponse(items, content_type='application/json')

    return render(request, 'designsafe/apps/notifications/index.html')#,
                  # {
                  #     'notifications': items,
                  #     'unread': unread
                  # })

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

def notifications(request):
    items = Notification.objects.filter(
        deleted=False, user=str(request.user)).order_by('-notification_time')
    unread = 0
    for i in items:
        if not i.read:
            unread += 1
            i.mark_read()
    try:
        items = serializers.serialize('json', items) #json.dumps(items, cls=DjangoJSONEncoder)
    except TypeError as e:
        items=[]
    return HttpResponse(items, content_type='application/json')

def delete_notification(request):
    if request.POST.get('delete') == 'delete':
        Notification.objects.get(id=request.POST.get('id')).delete()
        return redirect('index')

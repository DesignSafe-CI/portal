import json
import logging
from itertools import chain
from django.core import serializers
from django.http import HttpResponse
from django.shortcuts import render
from designsafe.apps.api.notifications.models import Notification
from designsafe.apps.notifications.models import Notification as LegacyNotification


LOGGER = logging.getLogger(__name__)


def index(request):
    return render(request, 'designsafe/apps/notifications/index.html')


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

import logging
from django.http.response import HttpResponseBadRequest
from django.http import HttpResponse
from django.core.urlresolvers import reverse
from django.shortcuts import render

from designsafe.apps.api.notifications.models import Notification

from designsafe.apps.api.views import BaseApiView
from designsafe.apps.api.mixins import JSONResponseMixin, SecureMixin
from designsafe.apps.api.exceptions import ApiException

import json

logger = logging.getLogger(__name__)


class ManageNotificationsView(SecureMixin, JSONResponseMixin, BaseApiView):

    def get(self, request, event_type = None, *args, **kwargs):
        limit = request.GET.get('limit', 0)
        page = request.GET.get('page', 0)

        if event_type is not None:
            notifs = Notification.objects.filter(event_type = event_type,
                          deleted = False,
                          user = request.user.username).order_by('-datetime')
            total = Notification.objects.filter(event_type = event_type,
                          deleted = False,
                          user = request.user.username).count()
        else:
            notifs = Notification.objects.filter(deleted = False,
                          user = request.user.username).order_by('-datetime')
            total = Notification.objects.filter(deleted = False,
                          user = request.user.username).count()
        if limit:
            limit = int(limit)
            page = int(page)
            offset = page * limit
            notifs = notifs[offset:offset+limit]

        for n in notifs:
            if not n.read:
                n.mark_read()

        notifs = [n.to_dict() for n in notifs]
        return self.render_to_json_response({'notifs':notifs, 'page':page, 'total': total})
        # return self.render_to_json_response(notifs)

    def post(self, request, *args, **kwargs):
        body_json = json.loads(request.body)
        nid = body_json['id']
        read = body_json['read']
        n = Notification.get(id = nid)
        n.read = read
        n.save()

    def delete(self, request, pk, *args, **kwargs):
        # body_json = json.loads(request.body)
        # nid = body_json['id']
        # deleted = body_json['deleted']
        # n = Notification.objects.get(pk = pk)
        # n.deleted = deleted
        # n.save()
        if pk == 'all':
            items=Notification.objects.filter(deleted=False, user=str(request.user))
            for i in items:
                i.mark_deleted()
        else:
            x = Notification.objects.get(pk=pk)
            x.mark_deleted()

        return HttpResponse('OK')

class NotificationsBadgeView(SecureMixin, JSONResponseMixin, BaseApiView):

    def get(self, request, *args, **kwargs):
        unread = Notification.objects.filter(deleted = False, read = False,
                      user = request.user.username).count()
        return self.render_to_json_response({'unread': unread})

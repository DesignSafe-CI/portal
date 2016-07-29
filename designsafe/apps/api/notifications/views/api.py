from django.http.response import HttpResponseBadRequest
from django.core.urlresolvers import reverse
from django.shortcuts import render

from designsafe.apps.api.notifications.models import Notification

from designsafe.apps.api.views import BaseApiView
from designsafe.apps.api.mixins import JSONResponseMixin, SecureMixin
from designsafe.apps.api.exceptions import ApiException

import json

class ManageNotificationsView(SecureMixin, JSONResponseMixin, BaseApiView):
    
    def get(self, request, event_type, *args, **kwargs):
        if event_type is not None:
            notifs = Notification.objects.filter(event_type = event_type,
                          deleted = False,
                          user = request.user.username).order_by('-datetime')
        else:
            notifs = Notification.objects.filter(deleted = False,
                          user = request.user.username).order_by('-datetime')

        notifs = [n.to_dict() for n in notifs]
        return self.render_to_json_response(notifs)

    def post(self, request, *args, **kwargs):
        body_json = json.loads(request.body)
        nid = body_json['id']
        read = body_json['read']
        n = Notification.get(id = nid)
        n.read = read
        n.save()

    def delete(self, request, *args, **kwargs):
        body_json = json.loads(request.body)
        nid = body_json['id']
        deleted = body_json['deleted']
        n = Notification.get(id = nid)
        n.deleted = deleted
        n.save()

import logging
import json
from django.http import HttpResponse, JsonResponse
from designsafe.apps.api.notifications.models import Notification
from designsafe.apps.api.views import BaseApiView
from designsafe.apps.api.mixins import JSONResponseMixin, SecureMixin


logger = logging.getLogger(__name__)


class ManageNotificationsView(SecureMixin, JSONResponseMixin, BaseApiView):

    def get(self, request, *args, **kwargs):
        """List all notifications of a certain event type."""
        limit = request.GET.get("limit", 0)
        page = request.GET.get("page", 0)
        read = request.GET.get("read")
        event_types = request.GET.getlist("eventTypes")

        query_params = {}
        if read is not None:
            query_params["read"] = json.loads(read)

        if event_types:
            notifs = Notification.objects.filter(
                event_type__in=event_types,
                deleted=False,
                user=request.user.username,
                **query_params
            ).order_by("-datetime")
            total = Notification.objects.filter(
                event_type__in=event_types, deleted=False, user=request.user.username
            ).count()
            unread = Notification.objects.filter(
                event_type__in=event_types,
                deleted=False,
                read=False,
                user=request.user.username,
            ).count()
        else:
            notifs = Notification.objects.filter(
                deleted=False, user=request.user.username, **query_params
            ).order_by("-datetime")
            total = Notification.objects.filter(
                deleted=False, user=request.user.username
            ).count()
            unread = Notification.objects.filter(
                deleted=False, read=False, user=request.user.username
            ).count()
        if limit:
            limit = int(limit)
            page = int(page)
            offset = page * limit
            notifs = notifs[offset : offset + limit]

        for n in notifs:
            if not n.read:
                n.mark_read()

        notifs = [n.to_dict() for n in notifs]
        return JsonResponse(
            {"notifs": notifs, "page": page, "total": total, "unread": unread}
        )

    def post(self, request, *args, **kwargs):
        body_json = json.loads(request.body)
        nid = body_json["id"]
        read = body_json["read"]
        n = Notification.get(id=nid)
        n.read = read
        n.save()

    def patch(self, request, *args, **kwargs):
        """Mark notifications as read."""
        body = json.loads(request.body)
        event_types = body.get("eventTypes")

        if event_types is not None:
            notifs = Notification.objects.filter(
                deleted=False,
                read=False,
                event_type__in=event_types,
                user=request.user.username,
            )
        else:
            notifs = Notification.objects.filter(
                deleted=False, read=False, user=request.user.username
            )
        for n in notifs:
            n.mark_read()

        return JsonResponse({"message": "OK"})

    def delete(self, request, pk, *args, **kwargs):
        # body_json = json.loads(request.body)
        # nid = body_json['id']
        # deleted = body_json['deleted']
        # n = Notification.objects.get(pk = pk)
        # n.deleted = deleted
        # n.save()
        if pk == "all":
            items = Notification.objects.filter(deleted=False, user=str(request.user))
            for i in items:
                i.mark_deleted()
        else:
            x = Notification.objects.get(pk=pk)
            x.mark_deleted()

        return HttpResponse("OK")


class NotificationsBadgeView(SecureMixin, JSONResponseMixin, BaseApiView):
    """View for notifications badge count"""

    def get(self, request, *args, **kwargs):
        """Get count of unread notifications of a certain event type."""
        event_types = request.GET.getlist("eventTypes")

        if event_types:
            unread = Notification.objects.filter(
                event_type__in=event_types,
                deleted=False,
                read=False,
                user=request.user.username,
            ).count()
        else:
            unread = Notification.objects.filter(
                deleted=False, read=False, user=request.user.username
            ).count()

        return JsonResponse({"unread": unread})

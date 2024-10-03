"""Signal receivers for notifications"""

import logging
import json
from django.db.models.signals import post_save
from django.dispatch import receiver
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from designsafe.apps.api.notifications.models import Notification, Broadcast

logger = logging.getLogger(__name__)

WEBSOCKETS_FACILITY = "websockets"


@receiver(post_save, sender=Notification, dispatch_uid="notification_msg")
def send_notification_ws(instance, created, **kwargs):
    """Send a websocket message to the user when a new notification is created."""

    if not created:
        return

    channel_layer = get_channel_layer()
    instance_dict = json.dumps(instance.to_dict())

    async_to_sync(channel_layer.group_send)(
        f"ds_{instance.user}", {"type": "ds.notification", "message": instance_dict}
    )

    return


@receiver(post_save, sender=Broadcast, dispatch_uid="broadcast_msg")
def send_broadcast_ws(instance, created, **kwargs):
    """Send a websocket message to all users when a new broadcast is created."""

    if not created:
        return

    channel_layer = get_channel_layer()
    instance_dict = json.dumps(instance.to_dict())

    async_to_sync(channel_layer.group_send)(
        "ds_broadcast", {"type": "ds.notification", "message": instance_dict}
    )

    return

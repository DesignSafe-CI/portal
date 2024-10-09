"""Signal receivers for notifications"""

import logging
import json
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from designsafe.apps.api.notifications.models import Notification, Broadcast
from designsafe.apps.onboarding.models import SetupEvent


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


@receiver(post_save, sender=SetupEvent, dispatch_uid="setup_event")
def send_setup_event(instance, **kwargs):
    """Send a websocket message to the user and all staff when a new setup event is created."""

    logger.info("Sending setup event through websocket")
    setup_event = instance

    # All staff will receive websocket notifications so they can see
    # setup event updates for users they are administering
    receiving_users = get_user_model().objects.all().filter(is_staff=True).values()

    channel_layer = get_channel_layer()

    # Add the setup_event's user to the notification list
    receiving_users.append(setup_event.user)

    data = {"event_type": "setup_event", "setup_event": setup_event.to_dict()}
    for user in set(receiving_users):
        async_to_sync(channel_layer.group_send)(
            f"ds_{user.username}",
            {"type": "ds.notification", "message": json.dumps(data)},
        )

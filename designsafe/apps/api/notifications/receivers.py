from django.dispatch import receiver
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.db.models.signals import post_save
from designsafe.apps.api.notifications.models import Notification, Broadcast
import logging
import json

logger = logging.getLogger(__name__)

WEBSOCKETS_FACILITY = "websockets"


@receiver(post_save, sender=Notification, dispatch_uid="notification_msg")
def send_notification_ws(sender, instance, created, **kwargs):
    # Only send WS message if it's a new notification not if we're updating.
    logger.debug("receiver received something.")
    if not created:
        return
    try:
        channel_layer = get_channel_layer()
        instance_dict = json.dumps(instance.to_dict())
        logger.debug(instance_dict)

        async_to_sync(channel_layer.group_send)(
            f"ds_{instance.user}", {"type": "ds.notification", "message": instance_dict}
        )

        # logger.debug('WS socket msg sent: {}'.format(instance_dict))
    except Exception as e:
        # logger.debug('Exception sending websocket message',
        #              exc_info=True,
        #              extra = instance.to_dict())
        logger.debug("Exception sending websocket message", exc_info=True)
    return


@receiver(post_save, sender=Broadcast, dispatch_uid="broadcast_msg")
def send_broadcast_ws(sender, instance, created, **kwargs):
    if not created:
        return
    try:
        event_type, user, body = decompose_message(instance)
        # rp = RedisPublisher(facility = WEBSOCKETS_FACILITY,broadcast=True)
        channel_layer = get_channel_layer()
        instance_dict = json.dumps(instance.to_dict())

        async_to_sync(channel_layer.group_send)(
            "ds_broadcast", {"type": "ds.notification", "message": instance_dict}
        )
        logger.debug("WS socket msg sent: {}".format(instance_dict))
    except Exception as e:
        logger.debug(
            "Exception sending websocket message",
            exc_info=True,
            extra=instance.to_dict(),
        )
    return

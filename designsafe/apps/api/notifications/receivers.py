from django.dispatch import receiver
from ws4redis.publisher import RedisPublisher
from ws4redis.redis_store import RedisMessage
from django.db.models.signals import post_save
from designsafe.apps.api.notifications.models import Notification, Broadcast
import logging
import json

logger = logging.getLogger(__name__)

WEBSOCKETS_FACILITY = 'websockets'


@receiver(post_save, sender=Notification, dispatch_uid='notification_msg')
def send_notification_ws(sender, instance, created, **kwargs):
    # Only send WS message if it's a new notification not if we're updating.
    logger.debug('receiver received something.')
    if not created:
        return
    try:
        rp = RedisPublisher(facility=WEBSOCKETS_FACILITY, users=[instance.user])
        instance_dict = json.dumps(instance.to_dict())
        msg = RedisMessage(instance_dict)
        rp.publish_message(msg)
    except Exception:
        logger.debug('Exception sending websocket message',
                     exc_info=True)
    return


@receiver(post_save, sender=Broadcast, dispatch_uid='broadcast_msg')
def send_broadcast_ws(sender, instance, created, **kwargs):
    if not created:
        return
    try:
        rp = RedisPublisher(facility=WEBSOCKETS_FACILITY, broadcast=True)
        instance_dict = json.dumps(instance.to_dict())
        msg = RedisMessage(instance_dict)
        rp.publish_message(msg)
        logger.debug('WS socket msg sent: {}'.format(instance_dict))
    except Exception:
        logger.debug('Exception sending websocket message',
                     exc_info=True,
                     extra=instance.to_dict())
    return

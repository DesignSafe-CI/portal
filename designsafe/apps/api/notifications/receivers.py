from django.dispatch import receiver
from ws4redis.publisher import RedisPublisher
from ws4redis.redis_store import RedisMessage
from django.db.models.signals import post_save
from designsafe.apps.api.notifications.signals import generic_event
from designsafe.apps.api.notifications.models import Notification, Broadcast
import logging
import json
import six
import cgi

logger = logging.getLogger(__name__)

WEBSOCKETS_FACILITY = 'websockets'

@receiver(post_save, sender=Notification, dispatch_uid='notification_msg')
def send_notification_ws(sender, instance, **kwargs):
    try:
        rp = RedisPublisher(facility = WEBSOCKETS_FACILITY, users=[instance.user])
        msg = RedisMessage(json.dumps(instance.to_dict()))
        rp.publish_message(msg)
    except Exception as e:
        logger.debug('Exception sending websocket message', 
                     exc_info=True,
                     extra = instance.to_dict())

@receiver(post_save, sender=Broadcast, dispatch_uid='broadcast_msg')
def send_broadcast_ws(sender, instance, **kwargs):
    try:
        event_type, user, body = decompose_message(instance)
        rp = RedisPublisher(facility = WEBSOCKETS_FACILITY,broadcast=True)
        msg = RedisMessage(json.dumps(instance.to_dict()))
        rp.publish_message(msg)
    except Exception as e:
        logger.debug('Exception sending websocket message', 
                     exc_info=True,
                     extra = instasnce.to_dict())

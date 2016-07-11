from django.dispatch import receiver
from ws4redis.publisher import RedisPublisher
from ws4redis.redis_store import RedisMessage
from designsafe.apps.api.notifications.signals import generic_event
from designsafe.apps.api.notifications.models import Notification, Broadcast
import logging
import json
import six
import cgi

logger = logging.getLogger(__name__)

WEBSOCKETS_FACILITY = 'websockets'

def decompose_message(instance):
    event_type = instance.event_type
    user = instance.user
    body = instance.body
    logger.debug('Event Type: {}'.format(event_type))
    logger.debug('User: {}'.format(user))
    logger.debug('Body: {}'.format(body))
    return event_type, user, body

@receiver(post_save, sender=Notification, dispatch_uid='notification_msg')
def send_notification_ws(sender, instance, **kwargs):
    try:
        event_type, user, body = decompose_message(instance)
        rp = RedisPublisher(facility = WEBSOCKETS_FACILITY, users=[user])
        msg = RedisMessage(json.dumps(instance.to_dict()))
        rp.publis_message(msg)
    except Exception as e:
        logger.debug('Exception sending websocket message', 
                     exc_info=True,
                     extra = instasnce.to_dict())

@receiver(post_save, sender=Broadcast, dispatch_uid='broadcast_msg')
def send_broadcast_ws(sender, instance, **kwargs):
    try:
        event_type, user, body = decompose_message(instance)
        rp = RedisPublisher(facility = WEBSOCKETS_FACILITY,broadcast=True)
        msg = RedisMessage(json.dumps(instance.to_dict()))
        rp.publis_message(msg)
    except Exception as e:
        logger.debug('Exception sending websocket message', 
                     exc_info=True,
                     extra = instasnce.to_dict())

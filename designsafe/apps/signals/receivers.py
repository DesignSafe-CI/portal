from django.shortcuts import render
from django.dispatch import receiver
from designsafe.apps.signals.signals import ds_event
from ws4redis.publisher import RedisPublisher
from ws4redis.redis_store import RedisMessage
import json
import logging
logger = logging.getLogger(__name__)


# Create your views here.

@receiver(ds_event)
def ds_event_callback(sender, **kwargs):
    event_type = kwargs.get('event_type', '')
    event_data = kwargs.get('event_data', '')

    logger.info('Event received from {0}'.format(sender))
    logger.info('Event Type: {0}'.format(event_type))
    logger.info('Event Data: {0}'.format(event_data))

    data = {
        'eventType': event_type,
        'data': event_data,
        }
    rp = RedisPublisher(facility = event_type, broadcast=True)

    msg = RedisMessage(json.dumps(data))
    rp.publish_message(msg)

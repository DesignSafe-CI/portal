from django.dispatch import receiver
from designsafe.apps.signals.signals import ds_event
from ws4redis.publisher import RedisPublisher
from ws4redis.redis_store import RedisMessage
import json
import logging
import copy

logger = logging.getLogger(__name__)


@receiver(ds_event, dispatch_uid = __name__)
def ds_event_callback(sender, **kwargs):
    WEBSOCKETS_FACILITY = 'websockets'
    event_type = kwargs.get('event_type', '')
    users = kwargs.get('users', [])

    data = copy.copy(kwargs)

    data.pop('signal')

    logger.info('Event received from {0}'.format(sender))
    logger.info('Event Type: {0}'.format(event_type))
    logger.info('Event kwargs: {0}'.format(kwargs))

    if users:
        rp = RedisPublisher(facility = WEBSOCKETS_FACILITY, users=users)
    else:
        rp = RedisPublisher(facility=WEBSOCKETS_FACILITY, broadcast=True)

    msg = RedisMessage(json.dumps(data))
    rp.publish_message(msg)

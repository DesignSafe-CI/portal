from django.db import models
from django.dispatch import receiver
from designsafe.apps.signals.signals import generic_event
from designsafe.apps.notifications.apps import Event
from designsafe.apps.notifications.models import Notification
from django.http import HttpResponse
from ws4redis.publisher import RedisPublisher
from ws4redis.redis_store import RedisMessage

import json
import logging

logger = logging.getLogger(__name__)


@receiver(generic_event)
def _interactive_job_callback(sender, **kwargs):
    event_type = kwargs.get('event_type')
    if event_type == 'VNC':
        event_data = kwargs.get('event_data')
        job_owner = event_data.get('job_owner')
        #check that job_owner, connection_address, and event_type are all defined

        WEBSOCKETS_FACILITY = 'websockets'
        users = [event_data.get('job_owner')]

        logger.info('Event received from {0}'.format(sender))
        logger.info('Sending {}'.format(event_data))

        notification = Notification(event_type=event_type, user=job_owner, body=json.dumps(event_data))
        notification.save()

        rp = RedisPublisher(facility = WEBSOCKETS_FACILITY, users=users)
        msg = RedisMessage(json.dumps(event_data))
        rp.publish_message(msg)

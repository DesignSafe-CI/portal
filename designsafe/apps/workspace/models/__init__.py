from django.db import models
from django.dispatch import receiver
from designsafe.apps.signals.signals import generic_event
from designsafe.apps.notifications.models import Notification
from designsafe.apps.workspace.models import app_entries

import json
import logging

logger = logging.getLogger(__name__)


@receiver(generic_event)
def _interactive_job_callback(sender, **kwargs):
    event_type = kwargs.get('event_type')
    if event_type == 'VNC':
        event_data = kwargs.get('event_data')
        job_owner = event_data.get('job_owner')

        WEBSOCKETS_FACILITY = 'websockets'
        users = [event_data.get('job_owner')]

        logger.info('Event received from %s', sender)
        logger.info('Sending %s', event_data)

        notification = Notification(
            event_type=event_type, user=job_owner, body=json.dumps(event_data))
        notification.save()

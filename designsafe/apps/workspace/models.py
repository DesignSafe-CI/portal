from django.db import models
from django.dispatch import receiver
from designsafe.apps.signals.signals import generic_event
import logging

logger = logging.getLogger(__name__)


@receiver(generic_event)
def _interactive_job_callback(sender, **kwargs):
    event_type = kwargs.get('event_type')
    if event_type == 'interactive_job':
        event_data = kwargs.get('event_data')
        logger.debug(event_data)

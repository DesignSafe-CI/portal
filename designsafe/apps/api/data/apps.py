from django.apps import AppConfig
from designsafe.apps.signals.signals import ds_event
import logging
logger = logging.getLogger(__name__)

class DataAPIConfig(AppConfig):
    name = 'designsafe.apps.api.data'
    verbose_name = 'Data API'
    label = 'data_api'

'''
    Placeholder for signals sender.
'''
class DataEvent(object):
    event_type = 'data'
    
    @classmethod
    def send_event(self, session_id, event_data):
        logger.info('sending event...')
        ds_event.send(sender=self.__class__, session_id = session_id, event_type = self.event_type, event_data = event_data);        

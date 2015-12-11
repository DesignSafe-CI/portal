from django.apps import AppConfig
from designsafe.apps.signals.signals import ds_event


class DataConfig(AppConfig):
    name = 'designsafe.apps.data'
    verbose_name = 'Designsafe Data'

'''
    Sender class for events
'''
class DataEvent(object):
    event_type = 'data'
   
    @classmethod
    def send_event(self, event_data):
        ds_event.send(sender=self.__class__, event_type = self.event_type, event_data = event_data);

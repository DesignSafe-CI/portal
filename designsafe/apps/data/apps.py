from django.apps import AppConfig
from designsafe.apps.signals.signals import ds_event, generic_event


class DataConfig(AppConfig):
    name = 'designsafe.apps.data'
    verbose_name = 'Designsafe Data'

'''
    Sender class for events
'''
class DataEvent(object):
    event_type = 'data'

    @classmethod
    def send_ds_event(self, event_data):
        ds_event.send_robust(sender=self.__class__, event_type = self.event_type, event_data = event_data)

    @classmethod
    def send_generic_event(self, event_data, event_users):
        generic_event.send_robust(sender=self.__class__,
                                  event_type = self.event_type,
                                  event_data = event_data,
                                  event_users = event_users)

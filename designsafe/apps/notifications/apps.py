from designsafe.apps.signals.signals import ds_event

class Event(object):
    @classmethod
    def send_event(self, event_type, event_data):
        ds_event.send(sender=self.__class__, event_type = event_type, **event_data);

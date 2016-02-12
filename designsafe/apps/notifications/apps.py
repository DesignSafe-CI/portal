from designsafe.apps.signals.signals import ds_event

class JobEvent(object):
    event_type = 'job'

    @classmethod
    def send_event(self, event_data):
        ds_event.send(sender=self.__class__, event_type = self.event_type, **event_data);

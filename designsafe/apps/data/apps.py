import logging
from django.apps import AppConfig
from designsafe.apps.signals.signals import ds_event, generic_event

#pylint: disable=invalid-name
logger = logging.getLogger(__name__)
#pylint: enable=invalid-name

class DataConfig(AppConfig):
    name = 'designsafe.apps.data'
    verbose_name = 'Designsafe Data'

    def ready(self):
        from elasticsearch_dsl.connections import connections
        from django.conf import settings
        try:
            connections.configure(
                default={'hosts': settings.ES_CONNECTIONS[settings.DESIGNSAFE_ENVIRONMENT]['hosts']},
                request_timeout=60,
                sniff_on_start=True,
                sniffer_timeout=60,
                sniff_on_connection_fail=True,
                sniff_timeout=10,
                max_retries=3,
                retry_on_timeout=True
            )
        except AttributeError as exc:
            logger.error('Missing ElasticSearch config. %s', exc)
            raise
        from designsafe.apps.data.models.agave.base import set_lazy_rels
        from designsafe.apps.projects.models.agave.experimental import *
        from designsafe.apps.projects.models.agave.simulation import *
        from designsafe.apps.projects.models.agave.hybrid_simulation import *
        from designsafe.apps.projects.models.agave.rapid import *
        set_lazy_rels()
        super(DataConfig, self).ready()

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

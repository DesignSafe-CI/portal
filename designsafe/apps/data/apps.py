"""Data app config."""
import logging
import socket

from django.apps import AppConfig
from django.conf import settings
from elasticsearch import Urllib3HttpConnection
from elasticsearch_dsl.connections import connections
from urllib3.connection import HTTPConnection

# pylint: disable=invalid-name
logger = logging.getLogger(__name__)
# pylint: enable=invalid-name


class KeepAliveConnection(Urllib3HttpConnection):
    """
    TCP Keepalive connection.
    Solution from Github issue: https://github.com/elastic/elasticsearch-py/issues/966#issuecomment-819823632
    """
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if not (settings.DEBUG or getattr(settings, "TEST", False)):
            self.pool.conn_kw['socket_options'] = HTTPConnection.default_socket_options + [
                (socket.SOL_SOCKET, socket.SO_KEEPALIVE, 1),
                (socket.IPPROTO_TCP, socket.TCP_KEEPIDLE, 60),
                (socket.IPPROTO_TCP, socket.TCP_KEEPINTVL, 30),
                (socket.IPPROTO_TCP, socket.TCP_KEEPCNT, 3),
            ]


class DataConfig(AppConfig):
    """Data config."""

    name = 'designsafe.apps.data'
    verbose_name = 'Designsafe Data'

    def ready(self):  # pylint:disable=too-many-locals
        """Run stuff when app is ready."""
        enable_sniffing = (settings.DESIGNSAFE_ENVIRONMENT != 'dev')
        try:
            connections.create_connection('default',
                                          hosts=settings.ES_CONNECTIONS[settings.DESIGNSAFE_ENVIRONMENT]['hosts'],
                                          http_auth=settings.ES_AUTH,
                                          max_retries=3,
                                          retry_on_timeout=True,
                                          connection_class=KeepAliveConnection,
                                          use_ssl=enable_sniffing,
                                          # sniff_on_start=enable_sniffing,
                                          # refresh nodes after a node fails to respond
                                          # sniff_on_connection_fail=enable_sniffing,
                                          # and also every 60 seconds
                                          # sniffer_timeout=60
                                          )
        except AttributeError as exc:
            logger.error('Missing ElasticSearch config. %s', exc)
            raise
        # We need to import every class so we can later setup the reverse
        # reverse relations.
        # pylint: disable=unused-import
        from designsafe.apps.data.models.agave.base import set_lazy_rels
        from designsafe.apps.projects.models.agave.experimental import (  # noqa: F401
            Analysis,
            Event,
            Experiment,
            ExperimentalProject,
            ModelConfig,
            SensorList,
        )
        from designsafe.apps.projects.models.agave.hybrid_simulation import (  # noqa: F401
            Coordinator,
            CoordinatorOutput,
            ExpOutput,
            ExpSubstructure,
            GlobalModel,
            HybridSimulation,
            HybridSimulationProject,
            SimOutput,
            SimSubstructure,
        )
        from designsafe.apps.projects.models.agave.rapid import (  # noqa: F401
            Collection,
            FieldReconProject,
            Instrument,
            Mission,
            ReferencedData,
        )
        from designsafe.apps.projects.models.agave.simulation import (  # noqa: F401
            Input,
            Model,
            Output,
            Simulation,
            SimulationProject,
        )
        set_lazy_rels()
        super().ready()

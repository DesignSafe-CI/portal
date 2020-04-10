"""Data app config."""
import logging
from django.apps import AppConfig
from django.conf import settings
from elasticsearch_dsl.connections import connections


# pylint: disable=invalid-name
logger = logging.getLogger(__name__)
# pylint: enable=invalid-name


class DataConfig(AppConfig):
    """Data config."""

    name = 'designsafe.apps.data'
    verbose_name = 'Designsafe Data'

    def ready(self):  # pylint:disable=too-many-locals
        """Run stuff when app is ready."""
        try:
            connections.create_connection('default',
                                          hosts=settings.ES_CONNECTIONS[settings.DESIGNSAFE_ENVIRONMENT]['hosts'],
                                          http_auth=settings.ES_AUTH,
                                          max_retries=3,
                                          retry_on_timeout=True,
                                          )
        except AttributeError as exc:
            logger.error('Missing ElasticSearch config. %s', exc)
            raise
        # We need to import every class so we can later setup the reverse
        # reverse relations.
        # pylint: disable=unused-import
        from designsafe.apps.projects.models.agave.experimental import (  # noqa: F401
            ExperimentalProject, FileModel as ExpFileModel, DataTag as ExpDataTag,
            Experiment, Analysis, ModelConfig, SensorList, Event, Report as ExpReport
        )
        from designsafe.apps.projects.models.agave.simulation import (  # noqa: F401
            SimulationProject, FileModel as SimFileModel, DataTag as SimDataTag,
            Simulation, Model, Input, Output, Analysis as SimAnalysis, Report as SimReport
        )
        from designsafe.apps.projects.models.agave.hybrid_simulation import (  # noqa: F401
            HybridSimulationProject, FileModel as HybFileModel, DataTag as HybDataTag,
            HybridSimulation, GlobalModel, Coordinator, SimSubstructure, ExpSubstructure,
            CoordinatorOutput, SimOutput, ExpOutput, Analysis as HybAnalysis,
            Report as HybReport
        )
        from designsafe.apps.projects.models.agave.rapid import (  # noqa: F401
            FieldReconProject, FileModel as FRFileModel, DataTag as FRDataTag,
            Mission, Instrument, ReferencedData, Collection, Report as FRReport
        )
        from designsafe.apps.data.models.agave.base import set_lazy_rels
        set_lazy_rels()
        super(DataConfig, self).ready()

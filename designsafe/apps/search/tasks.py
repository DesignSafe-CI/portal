from celery import shared_task
import datetime
import logging
from django.core.management import call_command
from django.conf import settings
from designsafe.apps.data.tasks import agave_indexer

logger = logging.getLogger(__name__)

@shared_task()
def update_search_index():
    logger.info("Updating search index")
    if not settings.DEBUG:
        call_command("rebuild_index", interactive=False)

@shared_task(bind=True)
def index_community_data(self):
    agave_indexer.delay('designsafe.storage.community', paths_to_ignore=['Trash'])

from celery import shared_task
import datetime
import logging
from django.core.management import call_command

logger = logging.getLogger(__name__)

@shared_task()
def update_search_index():
    logger.info("Updating search index")
    call_command("rebuild_index", interactive=False)

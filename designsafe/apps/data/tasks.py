import logging
from celery import shared_task
from django.conf import settings
from designsafe.apps.api.agave import get_service_account_client

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=3, retry_backoff=True, rate_limit="1/s")
def agave_indexer(self, systemId, filePath='/', username=None, recurse=True, update_pems = False, ignore_hidden=True, reindex=False, paths_to_ignore=[]):
    from designsafe.libs.elasticsearch.utils import index_level
    from designsafe.libs.elasticsearch.utils import walk_levels

    if username != None:
        pems_username = username
    else:
        pems_username = 'ds_admin'
    client = get_service_account_client()

    if not filePath.startswith('/'):
        filePath = '/' + filePath

    try:
        filePath, folders, files = next(walk_levels(client, systemId, filePath, ignore_hidden=ignore_hidden, paths_to_ignore=paths_to_ignore))
    except Exception as exc:
        logger.debug(exc)
        raise self.retry(exc=exc)

    index_level(client, filePath, folders, files, systemId, pems_username, update_pems=update_pems, reindex=reindex)
    if recurse:
        for child in folders:
            self.delay(systemId, filePath=child.path, reindex=reindex, update_pems=update_pems)

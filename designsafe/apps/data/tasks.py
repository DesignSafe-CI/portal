import logging
from celery import shared_task
from django.conf import settings
from designsafe.apps.api.agave import get_tg458981_client
from designsafe.libs.elasticsearch.utils import index_level, walk_levels, index_listing

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, queue='indexing', retry_backoff=True, rate_limit="10/s")
def agave_indexer(self, systemId, filePath='/', recurse=True, update_pems=False, ignore_hidden=True, reindex=False, *args, **kwargs):

    client = get_tg458981_client()
    if not filePath.startswith('/'):
        filePath = '/' + filePath

    try:
        filePath, folders, files = walk_levels(client, systemId, filePath, ignore_hidden=ignore_hidden).__next__()
        index_level(filePath, folders, files, systemId, reindex=reindex)
    except Exception as exc:
        logger.debug(exc)
        raise self.retry(exc=exc)

    if recurse:
        for child in folders:
            self.apply_async(args=[systemId],
                             kwargs={'filePath': child["path"],
                                     'reindex': reindex,
                                     'update_pems': update_pems},
                             queue='indexing')


@shared_task(bind=True, max_retries=3, queue='default')
def agave_listing_indexer(self, listing):
    index_listing(listing)

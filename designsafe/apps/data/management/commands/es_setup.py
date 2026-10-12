import getpass
import logging

import elasticsearch
from django.conf import settings
from django.core.management import BaseCommand

logger = logging.getLogger(__name__)
from designsafe.libs.elasticsearch.indices import init


class Command(BaseCommand):
    """
    This command reindexes all documents in the default files index in order to 
    apply new mappings/analyzers. It does NOT crawl Agave for file metadata, it
    only uses data that already exists in the file index. Usage is as simple as 
    running `./manage.py reindex-files`. 

    This works by resetting the index aliased as settings.ES_REINDEX_INDEX_ALIAS
    (applying any new mappings/analyzers defined in the portal.libs.elasticsearch.docs.base.IndexedFile
     class) and reindexing from the default files index to this new index. The 
     aliases are then swapped so that any Elasticsearch queries on the backend now 
     target the reindexed documents. 
    """

    help = "Reindex all files into a fresh index, then swap aliases with the current default index."

    def add_arguments(self, parser):
        parser.add_argument('--username', help='Username to populate files index', default="envision")
        parser.add_argument('--remote', help='Remote role to index from, either staging or default', default="staging")
        parser.add_argument('--local', help='Remote role to index from, either staging or default', default="dev")

    def handle(self, *args, **options):
        password = getpass.getpass('Enter password for remote ES cluster ')
        username = options.get('username')
        remote = options.get('remote')
        local = options.get('local')
        init()

        local_es_client = elasticsearch.Elasticsearch(settings.ES_CONNECTIONS[local]['hosts'],
                                                      timeout=300)
        remote_es_client = elasticsearch.Elasticsearch(settings.ES_CONNECTIONS[remote]['hosts'],
            http_auth=f"designsafe_{remote}:{password}",
                                                       timeout=300)
        def reindex(source_index, target_index, query=None):
            try:
                response = elasticsearch.helpers.reindex(
                    client=remote_es_client,
                    target_client=local_es_client,
                    source_index=source_index,
                    target_index=target_index,
                    query=query,
                )
                logger.info("Reindexed %s documents from %s to %s", response, source_index, target_index)
            except elasticsearch.helpers.BulkIndexError as e:
                logger.error("BulkIndexError: %s", e.errors)
                logger.error("Failed to reindex documents from %s to %s", source_index, target_index)
                return False
            return response

        indexes = ["designsafe-{}-files",
                   "designsafe-{}-publications",
                   "designsafe-{}-publications-legacy",
                   "designsafe-{}-projects",
                   "designsafe-{}-rapid-events",
                   "designsafe-{}-rapid-event-types"
                   ]

        failed_indexes = []
        for index in indexes:
            query = {"query": {"prefix": {"path._exact": f"/{username}"}}} if "files" in index else None
            result = reindex(
                source_index=index.format(remote),
                target_index=index.format(local),
                query=query
            )
            if not result:
                failed_indexes.append(index.format(local))
        logger.info("Finished indexing.")
        if failed_indexes:
            logger.error(
                "Successfully reindex %s"
                " of %s indexes\n"
                "failed indexes are: %s\n"
                "(check logs above for errors related to failures)",
                len(indexes) - len(failed_indexes),
                len(indexes),
                ", ".join(failed_indexes),
            )

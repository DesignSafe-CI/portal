import logging
from django.core.management import BaseCommand, CommandError
from django.utils.six.moves import input
from django.conf import settings
import elasticsearch
import getpass
logger = logging.getLogger(__name__)


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
        HOSTS = settings.ES_CONNECTIONS[settings.DESIGNSAFE_ENVIRONMENT]['hosts']
        password = getpass.getpass('Enter password for remote ES cluster ')
        username = options.get('username')
        remote = options.get('remote')
        local = options.get('local')

        local_es_client = elasticsearch.Elasticsearch(settings.ES_CONNECTIONS[local]['hosts'])
        remote_es_client = elasticsearch.Elasticsearch(settings.ES_CONNECTIONS[remote]['hosts'],
            **{'http_auth': "designsafe_{}:{}".format(remote, password)})


        elasticsearch.helpers.reindex(
            client=remote_es_client,
            target_client=local_es_client,
            source_index="designsafe-{}-files".format(remote),
            target_index="designsafe-{}-files".format(local),
            query={"query": {"prefix": {"path._exact": "/{}".format(username)}}}
        )

        elasticsearch.helpers.reindex(
            client=remote_es_client,
            target_client=local_es_client,
            source_index="designsafe-{}-publications".format(remote),
            target_index="designsafe-{}-publications".format(local)
        )

        elasticsearch.helpers.reindex(
            client=remote_es_client,
            target_client=local_es_client,
            source_index="designsafe-{}-publications-legacy".format(remote),
            target_index="designsafe-{}-publications-legacy".format(local)
        )

        elasticsearch.helpers.reindex(
            client=remote_es_client,
            target_client=local_es_client,
            source_index="designsafe-{}-projects".format(remote),
            target_index="designsafe-{}-projects".format(local)
        )



        logger.debug(remote_es_client.info())

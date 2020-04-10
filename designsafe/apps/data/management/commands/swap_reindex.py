from django.core.management import BaseCommand
from django.utils.six.moves import input
from django.conf import settings
import elasticsearch
from elasticsearch_dsl import Index
from designsafe.libs.elasticsearch.indices import setup_index


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
        parser.add_argument('--index', help='key in settings.ES_INDICES to reindex')
        parser.add_argument('--cleanup', help='Remove documents after swapping aliases to save space.', default=False, action='store_true')
        parser.add_argument('--swap-only', help='Only swap index aliases without reindexing.', default=False, action='store_true')

    def handle(self, *args, **options):
        HOSTS = settings.ES_CONNECTIONS[settings.DESIGNSAFE_ENVIRONMENT]['hosts']
        es_client = elasticsearch.Elasticsearch(HOSTS, http_auth=settings.ES_AUTH)
        index = options.get('index')
        cleanup = options.get('cleanup')
        swap_only = options.get('swap-only')

        index_config = settings.ES_INDICES[index]

        default_index_alias = index_config['alias']
        reindex_index_alias = default_index_alias + '-reindex'

        if not swap_only:
            confirm = eval(input('This will delete any documents in the index "{}" and recreate the index. Continue? (Y/n) '.format(reindex_index_alias)))
            if confirm != 'Y':
                raise SystemExit
            # Set up a fresh reindexing alias.
            setup_index(index_config, force=True, reindex=True)

        try:
            default_index_name = list(Index(default_index_alias, using=es_client).get_alias().keys())[0]
            reindex_index_name = list(Index(reindex_index_alias, using=es_client).get_alias().keys())[0]
        except Exception:
            self.stdout.write('Unable to lookup required indices by alias. Have you set up both a default and a reindexing index?')
            raise SystemExit

        if not swap_only:
            # Reindex file metadata from the default index to the reindexing index
            elasticsearch.helpers.reindex(es_client, default_index_name, reindex_index_name)

        alias_body = {
            'actions': [
                {'remove': {'index': default_index_name, 'alias': default_index_alias}},
                {'remove': {'index': reindex_index_name, 'alias': reindex_index_alias}},
                {'add': {'index': default_index_name, 'alias': reindex_index_alias}},
                {'add': {'index': reindex_index_name, 'alias': default_index_alias}},
            ]
        }
        # Swap the aliases of the default and reindexing aliases.
        es_client.indices.update_aliases(alias_body)

        # Re-initialize the new reindexing index to save space.
        if cleanup:
            reindex_index_name = list(Index(reindex_index_alias, using=es_client).get_alias().keys())[0]
            Index(reindex_index_name, using=es_client).delete(ignore=404)

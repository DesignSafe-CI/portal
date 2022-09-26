from django.conf import settings
from elasticsearch.helpers import bulk
from elasticsearch_dsl import Index
from designsafe.libs.elasticsearch.utils import file_uuid_sha256, grouper


def reindex_uuids(scan_generator, limit=1000):
    """
    Reindex files from CEP V1 format to CEP V2 format. In CEP V2, files are
    indexed under an ID that is the SHA256 hash of the system and path.
    Parameters
    ----------
    scan_generator: generator
        Generator of elasticsearch_dsl.response.Hit objects. This is passed as
        a parameter from the Django shell so that it can be resumed in case of
        timeout/exception.
    limit: int
        Number of documents to process per bulk request.
    """
    _count = 0  # Keep track of how many docs have been reindexed
    files_reindex_alias = settings.ES_INDEX_PREFIX.format('files-reindex')
    idx = Index(files_reindex_alias)
    idx_name = list(idx.get_alias().keys())[0]
    client = idx._get_connection()

    def hit_to_op(hit):
        uuid = file_uuid_sha256(hit.system, hit.path)
        doc = hit.to_dict()
        try:
            doc['_links']['self'] = doc['_links'].pop('_self')
        except KeyError:
            pass

        return {
            '_index': idx_name,
            '_id': uuid,
            'doc': doc,
            '_op_type': 'update',
            'doc_as_upsert': True
        }

    for group in grouper(scan_generator, limit):
        filtered_group = filter(lambda hit: hit is not None, group)
        ops = map(hit_to_op, filtered_group)
        bulk(client, ops)
        _count += limit
        print(_count)
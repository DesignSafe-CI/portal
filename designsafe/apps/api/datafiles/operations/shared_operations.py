import urllib
import os
import datetime
import io
from django.conf import settings
from requests.exceptions import HTTPError
import logging
import json
from elasticsearch_dsl import Q
import magic
from designsafe.apps.data.models.elasticsearch import IndexedFile
from designsafe.apps.api.datafiles.operations.agave_operations import preview, copy, download, download_bytes, listing as agave_listing
# from portal.libs.elasticsearch.indexes import IndexedFile
# from portal.apps.search.tasks import agave_indexer, agave_listing_indexer

logger = logging.getLogger(__name__)


def listing(client, system, path, username, offset=0, limit=100, *args, **kwargs):
    """
    Perform a Tapis file listing

    Params
    ------
    client: agavepy.agave.Agave
        Tapis client to use for the listing.
    system: str
        Tapis system ID.
    path: str
        Path in which to peform the listing.
    offset: int
        Offset for pagination.
    limit: int
        Number of results to return.

    Returns
    -------
    list
        List of dicts containing file metadata
    """

    if path:
        return agave_listing(client, system, path, offset, limit)

    username_q = Q('term', **{'permissions.username': username})
    world_q = Q('term', **{'permissions.username': 'WORLD'})
    pems_filter = Q('bool', should=[username_q, world_q])

    nested_filter = Q('nested')
    nested_filter.path = 'permissions'
    nested_filter.query = pems_filter

    file_path = '/'
    home_filter = Q('prefix', **{'path._exact': '/' + username})
    system_filter = Q('term', **{'system._exact': 'designsafe.storage.default'})
    query = Q('bool', must_not=home_filter, filter=[nested_filter, system_filter])

    search = IndexedFile.search().filter(query).sort('name._exact').extra(from_=int(offset), size=int(limit))
    res = search.execute()

    hits = [hit.to_dict() for hit in res]

    return {'listing': hits, 'reachedEnd': len(hits) < int(limit)}


def search(client, system, path, username, offset=0, limit=100, query_string='', **kwargs):
    """
    Perform a search for files using a query string.

    Params
    ------
    client: NoneType
    system: str
        Tapis system ID to filter on.
    path: NoneType
    offset: int
        Search offset for pagination.
    limit: int
        Number of search results to return
    query_string: str
        Query string to pass to Elasticsearch

    Returns
    -------
    list
        List of dicts containing file metadata from Elasticsearch

    """
    # Add leading slash to match agave formatting.
    if not path.startswith('/'):
        path = '/' + path
    # Add trailing slash so that prefix search in a folder doesn't return that folder.
    if not path.endswith('/'):
        path = path + '/'


    ngram_query = Q("query_string", query=query_string,
                    fields=["name"],
                    minimum_should_match='80%',
                    default_operator='or')
    match_query = Q("query_string", query=query_string,
                    fields=[
                        "name._exact, name._pattern"],
                    default_operator='and')


    username_q = Q('term', **{'permissions.username': username})
    world_q = Q('term', **{'permissions.username': 'WORLD'})
    pems_filter = Q('bool', should=[username_q, world_q])

    nested_filter = Q('nested')
    nested_filter.path = 'permissions'
    nested_filter.query = pems_filter

    home_filter = Q('prefix', **{'path._exact': '/' + username})
    system_filter = Q('term', **{'system._exact': 'designsafe.storage.default'})
    query = Q('bool', must_not=home_filter, filter=[nested_filter, system_filter])

    search = IndexedFile.search().filter(query)
    search = search.query(ngram_query | match_query)
    search = search.filter('prefix', **{'path._exact': path})
    

    search = search.extra(from_=int(offset), size=int(limit))
    res = search.execute()
    hits = [hit.to_dict() for hit in res]

    return {'listing': hits, 'reachedEnd': len(hits) < int(limit)}




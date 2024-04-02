import urllib.request, urllib.parse, urllib.error
from elasticsearch import Elasticsearch
import logging
import os
import datetime
from elasticsearch.helpers import bulk
from elasticsearch_dsl import Q
from elasticsearch_dsl.connections import get_connection
from hashlib import sha256
from itertools import zip_longest

from django.conf import settings

logger = logging.getLogger(__name__)


def current_time():
    """
    Wraps datetime.datetime.now() for convenience of mocking.

    Returns
    -------
    datetime.datetime
    """
    return datetime.datetime.now()


def get_sha256_hash(string):
    """
    Compute sha256 hash of a string as a UUID for indexing.

    Parameters
    ----------
    string: str
        String to hash.

    Returns
    -------
    str
    """
    return sha256((string).encode()).hexdigest()


def file_uuid_sha256(system, path):
    """
    Compute sha256 hash of a system/path combination as a UUID for indexing.

    Parameters
    ----------
    system: str
        The Tapis system ID.
    path: str
        Path to file file being indexed, relative to the storage system root.

    Returns
    -------
    str
    """

    if not path.startswith("/"):
        path = "/{}".format(path)
    # str representation of the hash of e.g. "cep.home.user/path/to/file"
    return sha256((system + path).encode()).hexdigest()


def grouper(iterable, n, fillvalue=None):
    """
    Recipe from itertools docs.
    Collect data into fixed-length chunks or blocks.
    """
    # grouper('ABCDEFG', 3, 'x') --> ABC DEF Gxx"
    args = [iter(iterable)] * n
    return zip_longest(*args, fillvalue=fillvalue)


def walk_children(system, path, include_parent=False, recurse=False):
    """
    Yield an elasticsearch hit for each child of an indexed file.

    Parameters
    ----------
    system: str
        The Tapis system ID.
    path: str
        The path relative to the system root.
    include_parent: bool
        Whether the listing should include the parent as well as the children.
    recurse: bool
        If True, simulate a recursive listing by doing a prefix search on the
        root path.

    Yields
    ------
    elasticsearch_dsl.response.hit.Hit

    """
    from designsafe.apps.data.models.elasticsearch import IndexedFile

    search = IndexedFile.search()
    search = search.filter(Q({"term": {"system._exact": system}}))
    if recurse:
        basepath_query = Q({"prefix": {"basePath._exact": path}})
    else:
        basepath_query = Q({"term": {"basePath._exact": path}})

    if include_parent:
        path_query = Q({"term": {"path._exact": path}})
        search = search.filter(basepath_query | path_query)
    else:
        search = search.filter(basepath_query)

    for hit in search.scan():
        yield hit


def delete_recursive(system, path):
    """
    Recursively delete all Elasticsearch documents in a specified system/path.

    Parameters
    ----------
    system: str
        The Tapis system ID containing files to be deleted.
    path: str
        The path relative to the system root. All documents with this path as a
        prefix will be deleted.

    Returns
    -------
    Void
    """
    from designsafe.apps.data.models.elasticsearch import IndexedFile

    hits = walk_children(system, path, include_parent=True, recurse=True)
    idx = IndexedFile.Index.name
    client = get_connection("default")

    # Group children in batches of 100 for bulk deletion.
    for group in grouper(hits, 100):
        filtered_group = filter(lambda hit: hit is not None, group)
        ops = map(
            lambda hit: {"_index": idx, "_id": hit.meta.id, "_op_type": "delete"},
            filtered_group,
        )
        bulk(client, ops)


def iterate_level(client, system, path, limit=100):
    """Iterate over a filesystem level yielding an attrdict for each file/folder
    on the level.
    :param str client: an Agave client
    :param str system: system
    :param str path: path to walk
    :param int limit: Number of docs to retrieve per API call

    :rtype agavepy.agave.AttrDict
    """
    offset = 0

    while True:
        page = client.files.list(
            systemId=system,
            filePath=urllib.parse.quote(path),
            offset=offset,
            limit=limit,
        )
        yield from page
        offset += limit
        if len(page) != limit:
            # Break out of the loop if the listing is exhausted.
            break


# pylint: disable=too-many-locals


def walk_levels(
    client, system, path, bottom_up=False, ignore_hidden=False, paths_to_ignore=None
):
    """Walk a pth in an Agave storgae system.

    This generator will walk an agave storage system and return a tuple with
    the root path, a list of folder and a list of files. This function is more
    like :func:`os.walk` than :func:`walk`.

    :param str system: system
    :param str path: path to walk
    :param bool bottom_up:if ``True`` walk the path bottom to top.

    :returns: (<str root_path>, [<``BaseFile`` folders>],
        [<``BaseFile`` files>])
    :rtype: tuple

    .. note::
        Similar to :func:`os.walk` the ``files`` and ``folders`` list can be
        modified inplace to modify future iterations. Modifying the ``files``
        and ``folders`` lists inplace can be used to tell the genrator of any
        modifications done with every iterations.

    :Example:
    >>> #Walk a specific number of levels
    >>> levels = 2
    >>> for root, folders, files in walk_levels('system.id','home_dir/path'):
    >>>     #do cool things
    >>>     #first check if we are at the necessary level
    >>>     if levels and len(root.split('/')) >= levels:
    ...         #delte everything from the folders list
    ...         del folders[:]

    """

    if not paths_to_ignore:
        paths_to_ignore = []

    folders = []
    files = []
    for agave_file in iterate_level(client, system, path):
        if agave_file["name"] == ".":
            continue
        if (ignore_hidden and agave_file["name"][0] == ".") or (
            agave_file["name"] in paths_to_ignore
        ):
            continue
        if agave_file["format"] == "folder":
            folders.append(agave_file)
        else:
            files.append(agave_file)
    if not bottom_up:
        yield (path, folders, files)
    for child in folders:
        for child_path, child_folders, child_files in walk_levels(
            client, system, child["path"], bottom_up=bottom_up
        ):
            yield (child_path, child_folders, child_files)

    if bottom_up:
        yield (path, folders, files)


def index_listing(files):
    """
    Index the result of a Tapis listing. Files are indexed with a UUID
    comprising the SHA256 hash of the system + path.

    Parameters
    ----------
    files: list
        list of Tapis files (either dict or agavepy.agave.Attrdict)

    Returns
    -------
    Void
    """
    from designsafe.apps.data.models.elasticsearch import IndexedFile

    idx = IndexedFile.Index.name
    client = get_connection("default")
    ops = []
    for _file in files:
        file_dict = dict(_file)
        if file_dict["name"][0] == ".":
            continue
        file_dict["lastUpdated"] = current_time()
        file_dict["basePath"] = os.path.dirname(file_dict["path"])
        file_uuid = file_uuid_sha256(file_dict["system"], file_dict["path"])
        ops.append(
            {
                "_index": idx,
                "_id": file_uuid,
                "doc": file_dict,
                "_op_type": "update",
                "doc_as_upsert": True,
            }
        )

    bulk(client, ops)


def index_level(path, folders, files, systemId, reindex=False):
    """
    Index a set of folders and files corresponding to the output from one
    iteration of walk_levels

    Parameters
    ----------
    path: str
        The path to the parent folder being indexed, relative to the system root.
    folders: list
        list of Tapis folders (either dict or agavepy.agave.Attrdict)
    files: list
        list of Tapis files (either dict or agavepy.agave.Attrdict)
    systemId: str
        ID of the Tapis system being indexed.

    Returns
    -------
    Void
    """

    index_listing(folders + files)

    children_paths = [_file["path"] for _file in folders + files]
    for hit in walk_children(systemId, path, recurse=False):
        if hit["path"] not in children_paths:
            logger.debug(f"DELETING RECURSIVE: {hit.system}/{hit.path}")
            logger.debug(children_paths)
            delete_recursive(hit.system, hit.path)


def repair_path(name, path):
    if not path.endswith(name):
        path = path + "/" + name
    path = path.strip("/")
    return "/{path}".format(path=path)


def repair_paths(limit=1000):
    from designsafe.apps.data.models.elasticsearch import IndexedFile
    from elasticsearch import Elasticsearch
    from elasticsearch.helpers import bulk

    files_alias = settings.ES_INDICES["files"]["alias"]
    HOSTS = settings.ES_CONNECTIONS[settings.DESIGNSAFE_ENVIRONMENT]["hosts"]
    es_client = Elasticsearch(hosts=HOSTS)
    file_search = IndexedFile.search().sort("_id").extra(size=limit)
    res = file_search.execute()

    while res.hits:
        update_ops = []
        for hit in res.hits:

            if hit.name is None or hit.path is None:
                continue

            new_path = repair_path(hit.name, hit.path)
            new_basepath = os.path.dirname(new_path)

            update_ops.append(
                {
                    "_op_type": "update",
                    "_index": files_alias,
                    "_type": "file",
                    "_id": hit.meta.id,
                    "doc": {"path": new_path, "basePath": new_basepath},
                }
            )

            # use from_path to remove any duplicates.
            # IndexedFile.from_path(hit.system, hit.path)

        bulk(es_client, update_ops)
        search_after = res.hits.hits[-1]["sort"]
        file_search = (
            IndexedFile.search()
            .sort("_id")
            .extra(size=limit, search_after=search_after)
        )
        res = file_search.execute()


def new_es_client():
    """
    Instantiate a new Elasticsearch client to use when overriding the default.
    """
    use_ssl = not settings.DESIGNSAFE_ENVIRONMENT == "dev"
    return Elasticsearch(
        hosts=settings.ES_CONNECTIONS[settings.DESIGNSAFE_ENVIRONMENT]["hosts"],
        http_auth=settings.ES_AUTH,
        max_retries=3,
        retry_on_timeout=True,
        use_ssl=use_ssl,
    )

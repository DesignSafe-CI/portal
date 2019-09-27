from future.utils import python_2_unicode_compatible
import urllib.request, urllib.parse, urllib.error
import logging
import os 

from django.conf import settings

logger = logging.getLogger(__name__)

# pylint: disable=too-many-locals
@python_2_unicode_compatible
def walk_levels(client, system, path, bottom_up=False, ignore_hidden=False, paths_to_ignore=[]):
    """Walk a path in an Agave storgae system.

    This generator will walk an agave storage system and return a tuple with
    the root path, a list of folder and a list of files. This function is more
    like :func:`os.walk` than :func:`walk`.

    :param str system: system
    :param str path: path to walk
    :param bool bottom_up:if ``True`` walk the path bottom to top.

    :returns: (<str root_path>,
        [<:class:`~designsafe.apps.data.models.agave.files.BaseFileResource` folders>],
        [<:class:`~designsafe.apps.data.models.agave.files.BaseFileResource` files>])
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
    from designsafe.apps.data.models.agave.files import BaseFileResource
    listing = []
    offset = 0
    page = client.files.list(systemId=system,
                             filePath=urllib.parse.quote(path),
                             offset=offset)
    while page:
        listing += page
        offset += 100
        page = client.files.list(systemId=system,
                                 filePath=urllib.parse.quote(path),
                                 offset=offset)

    folders = []
    files = []
    for json_file in listing:
        if json_file['name'] == '.':
            continue
        if (ignore_hidden and json_file['name'][0] == '.') or (json_file['name'] in paths_to_ignore):
            continue
        _file = BaseFileResource(client, **json_file)
        if _file.format == 'folder':
            folders.append(_file)
        else:
            files.append(_file)
    if not bottom_up:
        yield (path, folders, files)
    for child in folders:
        for (
                child_path,
                child_folders,
                child_files
        ) in walk_levels(
            client,
            system,
            child.path,
            bottom_up=bottom_up
        ):
            yield (child_path, child_folders, child_files)

    if bottom_up:
        yield (path, folders, files)

@python_2_unicode_compatible
def index_level(client, path, folders, files, systemId, username, reindex=False, update_pems=True):
    """
    Index a set of folders and files corresponding to the output from one 
    iteration of walk_levels
    """
    from designsafe.libs.elasticsearch.docs.files import BaseESFile
    for obj in folders + files:
            obj_dict = obj.to_dict()
            obj_dict.pop('permissions')
            obj_dict.pop('trail')
            obj_dict.pop('_links')
            obj_dict['basePath'] = os.path.dirname(obj.path)
            doc = BaseESFile(username, reindex=reindex, **obj_dict)
            
            saved = doc.save()
            
            if update_pems:
                permissions = client.files.listPermissions(systemId=systemId, filePath=obj.path)
                for pem in permissions:
                    pem.pop('_links')
                doc.update(**{'permissions': permissions})

    children_paths = [_file.path for _file in folders + files]
    es_root = BaseESFile(username, systemId, path, reindex=reindex)
    for doc in es_root.children():
        if doc is not None and doc.path not in children_paths and doc.path != path:
            doc.delete()

@python_2_unicode_compatible
def repair_path(name, path):
    if not path.endswith(name):
        path = path + '/' + name
    path = path.strip('/')
    return '/{path}'.format(path=path)

@python_2_unicode_compatible
def repair_paths(limit=1000):
    from designsafe.apps.data.models.elasticsearch import IndexedFile
    from elasticsearch import Elasticsearch
    from elasticsearch.helpers import bulk

    files_alias = settings.ES_INDICES['files']['alias']
    HOSTS = settings.ES_CONNECTIONS[settings.DESIGNSAFE_ENVIRONMENT]['hosts']
    es_client = Elasticsearch(hosts=HOSTS)
    file_search = IndexedFile.search().sort('_uid').extra(size=limit)
    res = file_search.execute()

    while res.hits:
        update_ops = []
        for hit in res.hits:
            
            if hit.name is None or hit.path is None:
                continue

            new_path = repair_path(hit.name, hit.path)
            new_basepath = os.path.dirname(new_path)

            update_ops.append({
                '_op_type': 'update',
                '_index': files_alias,
                '_type': 'file',
                '_id': hit.meta.id,
                'doc': {
                    'path': new_path,
                    'basePath': new_basepath
                }
            })
            
            # use from_path to remove any duplicates.
            # IndexedFile.from_path(hit.system, hit.path)
        
        bulk(es_client, update_ops)
        search_after = res.hits.hits[-1]['sort']
        logger.debug(search_after)
        file_search = IndexedFile.search().sort('_uid').extra(size=limit, search_after=search_after)
        res = file_search.execute()

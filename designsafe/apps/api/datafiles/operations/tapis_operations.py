import io
import json
import logging
import os
import urllib
from pathlib import Path
import tapipy
from designsafe.apps.api.datafiles.utils import *
from designsafe.apps.data.models.elasticsearch import IndexedFile
from designsafe.apps.data.tasks import agave_indexer, agave_listing_indexer
from designsafe.apps.api.filemeta.models import FileMetaModel
from designsafe.apps.api.filemeta.tasks import move_file_meta_async, copy_file_meta_async
from designsafe.apps.api.datafiles.models import PublicationSymlink
from django.conf import settings
from elasticsearch_dsl import Q
import requests
from requests.exceptions import HTTPError

logger = logging.getLogger(__name__)


def listing(client, system, path, offset=0, limit=100, q=None, *args, **kwargs):
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

    if q:
        return search(client, system, path, offset=0, limit=100, query_string=q, **kwargs)
    raw_listing = client.files.listFiles(
        systemId=system,
        path=(path or '/'),
        offset=int(offset),
        limit=int(limit),
        headers={"X-Tapis-Tracking-ID": kwargs.get("tapis_tracking_id", "")}
    )

    listing_resp = []
    for f in raw_listing:
        accessor = f"tapis://{system}/{f.path.lstrip('/')}"
        type_str = 'dir' if f.type == 'dir' else 'file'
        format_str = 'folder' if type_str == 'dir' else 'raw'

        # Update type/format if it's a symlink and we have a DB match
        if getattr(f, "type", None) == "symbolic_link":
            try:
                rec = PublicationSymlink.objects.get(tapis_accessor=accessor)
                type_str = rec.type
                format_str = 'folder' if type_str == 'dir' else 'raw'
            except PublicationSymlink.DoesNotExist:
                type_str = 'dir'
                format_str = 'folder'
        else:
            type_str = 'dir' if f.type == 'dir' else 'file'
            format_str = 'folder' if type_str == 'dir' else 'raw'       

        listing_resp.append({
            'system': system,
            'type': type_str,
            'format': format_str,
            'mimeType': f.mimeType,
            'path': f"/{f.path}",
            'name': f.name,
            'length': f.size,
            'lastModified': f.lastModified,
            '_links': {'self': {'href': f.url}},
        })

    agave_listing_indexer.delay(listing_resp)
    return {'listing': listing_resp, 'reachedEnd': len(listing_resp) < int(limit)}


def logentity(client, system, path, *args, **kwargs):
    """
    No-op function to allow primary entity views to be logged as listings.
    """
    return {}


def detail(client, system, path, *args, **kwargs):
    """
    Retrieve the uuid for a file by parsing the query string in _links.metadata.href
    """
    _listing = client.files.listFiles(systemId=system, path=urllib.parse.quote(path), offset=0, limit=1, headers={"X-Tapis-Tracking-ID": kwargs.get("tapis_tracking_id", "")})
    f = _listing[0]
    listing_res = {
            'system': system,
            'type': 'dir' if f.type == 'dir' else 'file',
            'format': 'folder' if f.type == 'dir' else 'raw',
            'mimeType': f.mimeType,
            'path': f"/{f.path}",
            'name': f.name,
            'length': f.size,
            'lastModified': f.lastModified,
            '_links': {
                'self': {'href': f.url}
            }}

    return listing_res


def iterate_listing(client, system, path, limit=100):
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
        page = listing(client, system, path, offset, limit)['listing']
        yield from page
        offset += limit
        if len(page) != limit:
            # Break out of the loop if the listing is exhausted.
            break


def search(client, system, path, offset=0, limit=100, query_string='', **kwargs):
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
    ngram_query = Q("query_string", query=query_string,
                    fields=["name"],
                    minimum_should_match='80%',
                    default_operator='or')
    match_query = Q("query_string", query=query_string,
                    fields=[
                        "name._exact, name._pattern"],
                    default_operator='and')

    if not path.startswith('/'):
        path = '/' + path

    path = f"/{path.strip('/')}"

    search = IndexedFile.search()
    search = search.query(ngram_query | match_query)
    if path != '/':
        path_comp_filter = Q('term', **{'path._comps': path})
        # check old publication files
        # stopgap until all /published-data paths are indexed
        if system == "designsafe.storage.published" and path.startswith("/published-data"):
            legacy_pub_path = path.lstrip("/published-data")
            legacy_path_filter  = Q('term', **{'path._comps': legacy_pub_path})
            path_comp_filter = path_comp_filter | legacy_path_filter

        search = search.filter(path_comp_filter)
    search = search.filter('term', **{'system._exact': system})
    search = search.extra(from_=int(offset), size=int(limit))
    res = search.execute()
    hits = [hit.to_dict() for hit in res]

    return {'listing': hits, 'reachedEnd': len(hits) < int(limit)}


def download(client, system, path=None, paths=None, *args, **kwargs):
    """Creates a postit pointing to this file.

    Params
    ------
    client: agavepy.agave.Agave
        Tapis client to use.
    system: NoneType
    path: NoneType
    paths: List[str]
        List of paths to include in the ZIP archive.

    Returns
    -------
    str
    Post it link.
    """
    # pylint: disable=protected-access

    token = None
    if client is not None:
        token = client.access_token.access_token
    zip_endpoint = "https://designsafe-download01.tacc.utexas.edu/check"
    data = json.dumps({'system': system, 'paths': paths})
    # data = json.dumps({'system': 'designsafe.storage.published', 'paths': ['PRJ-2889']})
    resp = requests.put(zip_endpoint, headers={"x-tapis-token": token}, data=data)
    resp.raise_for_status()
    download_key = resp.json()["key"]
    return {"href": f"https://designsafe-download01.tacc.utexas.edu/download/{download_key}"}


def mkdir(client, system, path, dir_name, *args, **kwargs):
    """Create a new directory.

    Params
    ------
    client: agavepy.agave.Agave
        Tapis client to use for the listing.
    system: str
        Tapis system ID.
    path: str
        Path in which to run mkdir.
    dir_name: str
        Name of the directory

    Returns
    -------
    dict
    """
    path_input = str(Path(path) / Path(dir_name)).rstrip(" ")
    client.files.mkdir(systemId=system, path=path_input)


    agave_indexer.apply_async(kwargs={'systemId': system,
                                      'filePath': path,
                                      'recurse': False},
                              queue='indexing',
                              headers={"X-Tapis-Tracking-ID": kwargs.get("tapis_tracking_id", "")})
    return {"result": "OK"}


def move(client, src_system, src_path, dest_system, dest_path, *args, **kwargs):
    """
    Move files and related file metadata

    Params
    ------
    client: agavepy.agave.Agave
        Tapis client to use for the listing.
    src_system: str
        System ID for the file's source.
    src_path: str
        Path to the source file.
    dest_system: str
        System ID for the destination.
    dest_path: str
        Path under which the file should be moved.

    Returns
    -------
    dict

    """
    src_filename = Path(src_path).name
    dest_path_full = str(Path(dest_path) / src_filename)

    if src_system != dest_system:
        raise ValueError("src_system and dest_system must be identical for move.")
    client.files.moveCopy(systemId=src_system, 
                          path=src_path,
                          operation="MOVE",
                          newPath=dest_path_full,
                          headers={"X-Tapis-Tracking-ID": kwargs.get("tapis_tracking_id", "")})
    
    move_file_meta_async.delay(src_system, src_path, dest_system, dest_path_full)


    #update_meta.apply_async(kwargs={
    #    "src_system": src_system,
    #    "src_path": src_path,
    #    "dest_system": dest_system,
    #    "dest_path": dest_path_full
    #}, queue="indexing")

    agave_indexer.apply_async(kwargs={
        'systemId': dest_system,
        'filePath': dest_path,
        'recurse': False
    }, queue='indexing')
    
    agave_indexer.apply_async(kwargs={
        'systemId': dest_system,
        'filePath': dest_path_full,
        'recurse': True
    }, queue='indexing')

    return {"result": "OK"}


def copy(client, src_system, src_path, dest_system, dest_path, *args, **kwargs):
    """
    Copy files and related file metadata

    Params
    ------
    client: agavepy.agave.Agave
        Tapis client to use for the listing.
    src_system: str
        System ID for the file's source.
    src_path: str
        Path to the source file.
    dest_system: str
        System ID for the destination.
    dest_path: str
        Path under which the file should be Copied.

    Returns
    -------
    dict

    """
    src_file_name = os.path.basename(src_path)
    try:
        client.files.listFiles(systemId=dest_system, path=os.path.join(dest_path, src_file_name))
        dst_file_name = rename_duplicate_path(src_file_name)
        full_dest_path = os.path.join(dest_path.strip('/'), dst_file_name)
    except:
        dst_file_name = src_file_name
        full_dest_path = os.path.join(dest_path.strip('/'), src_file_name)

    if src_system == dest_system:
        copy_result = client.files.moveCopy(systemId=src_system,
                                            path=src_path,
                                            operation="COPY",
                                            newPath=full_dest_path,
                                            headers={"X-Tapis-Tracking-ID": kwargs.get("tapis_tracking_id", "")})
    else:
        src_url = f'tapis://{src_system}/{src_path}'
        dest_url = f'tapis://{dest_system}/{full_dest_path}'

        copy_response = client.files.createTransferTask(elements=[{
            'sourceURI': src_url,
            'destinationURI': dest_url
        }], headers={"X-Tapis-Tracking-ID": kwargs.get("tapis_tracking_id", "")})
        copy_result = {
            'uuid': copy_response.uuid,
            'status': copy_response.status,
        }



    #copy_meta.apply_async(kwargs={
    #    "src_system": src_system,
    #    "src_path": src_path,
    #    "dest_system": dest_system,
    #    "dest_path": full_dest_path
    #}, queue='indexing')

    copy_file_meta_async.delay(src_system, src_path, dest_system, full_dest_path)

    agave_indexer.apply_async(kwargs={
        'systemId': dest_system,
        'filePath': full_dest_path,
        'recurse': True
    }, queue='indexing')

    agave_indexer.apply_async(kwargs={
        'username': 'ds_admin',
        'systemId': dest_system,
        'filePath': dest_path,
        'recurse': False
    }, queue='indexing')

    return dict(copy_result)


def delete(client, system, path, *args, **kwargs):
    return client.files.delete(systemId=system,
                               filePath=urllib.parse.quote(path),
                               headers={"X-Tapis-Tracking-ID": kwargs.get("tapis_tracking_id", "")})

def rename(client, system, path, new_name, *args, **kwargs):
    """Renames a file. This is performed under the hood by moving the file to
    the same parent folder but with a new name.

     Params
    ------
    client: agavepy.agave.Agave
        Tapis client to use.
    system: str
        Tapis system ID for the file.
    path: str
        Path of the file relative to the storage system root.
    new_name: str
        New name for the file.

    Returns
    -------
    dict
    """
    # NOTE: There seems to be inconsistant values in file operation response
    # objects returned by tapis. The "nativeFormat" field has returned
    # values representing a file, when the operation was carried out on
    # a directory...
    # listing[0].type == 'file'
    # listing[0].type == 'dir'
    path = path.strip('/')
    new_path = str(Path(path).parent / new_name)

    client.files.moveCopy(systemId=system, 
                          path=path,
                          operation="MOVE",
                          newPath=new_path,
                          headers={"X-Tapis-Tracking-ID": kwargs.get("tapis_tracking_id", "")})

    move_file_meta_async.delay(system, path, system, new_path)

    agave_indexer.apply_async(kwargs={'systemId': system,
                                      'filePath': os.path.dirname(path),
                                      'recurse': False},
                              queue='indexing')
    
    agave_indexer.apply_async(kwargs={'systemId': system,
                                      'filePath': new_path,
                                      'recurse': True},
                              queue='indexing')
    
    return {"result": "OK"}



def trash(client, system, path, trash_path, *args, **kwargs):
    """Move a file to the .Trash folder.

    Params
    ------
    client: agavepy.agave.Agave
        Tapis client to use.
    system: str
        Tapis system ID for the file.
    path: str
        Path of the file relative to the storage system root.
    trash_path: str
        Path to the trash folder in the current system, e.g. '/.trash'
    Returns
    -------
    dict
    """
    trash_root = os.path.dirname(trash_path)
    trash_foldername = os.path.basename(trash_path)

    # Create a trash path if none exists
    try:
        client.files.listFiles(systemId=system,
                          path=trash_path)
    except tapipy.errors.NotFoundError:
        mkdir(client, system, trash_root, trash_foldername)

    resp = move(client, system, path, system, trash_path, tapis_tracking_id=kwargs.get("tapis_tracking_id", ""))

    return resp


def upload(client, system, path, uploaded_file, webkit_relative_path=None, *args, **kwargs):
    """Upload a file.
    Params
    ------
    client: agavepy.agave.Agave
        Tapis client to use.
    system: str
        Tapis system ID for the file.
    path: str
        Path to upload the file to.
    uploaded_file: file
        File object to upload.
    webkit_relative_path: string
        path for file structure of uploaded directory.

    Returns
    -------
    dict
    """
    # NOTE:
    # Directory and file uploads are not compared against the upload path for an existing listing.
    # This could provide a bad user experience when their files are just uploaded and overwrite
    # existing data. We will need to be able to handle directory/folder uploads as a single operation.

    if webkit_relative_path:
        rel_path = os.path.dirname(webkit_relative_path).strip('/')
        mkdir(client, system, path, rel_path)
        path = os.path.join(path, rel_path)

    upload_name = os.path.basename(uploaded_file.name)


    dest_path = os.path.join(path.strip('/'), uploaded_file.name)
    response_json = client.files.insert(systemId=system,   
                                        path=dest_path, 
                                        file=uploaded_file, 
                                        headers={"X-Tapis-Tracking-ID": kwargs.get("tapis_tracking_id", "")})
    return {"result": "OK"}
    agave_indexer.apply_async(kwargs={'systemId': system,
                                      'filePath': path,
                                      'recurse': False},
                              queue='indexing'
                              )

    # attempt to gather standardized metadata from upload
    try:
        metadata = scrape_metadata_from_file(uploaded_file)
        if metadata:
            create_meta(
                path=os.path.join('/', path, upload_name),
                system=system,
                meta=metadata
            )
        return dict(resp)
    except:
        return dict(resp)


def preview(client, system, path, href="", max_uses=3, lifetime=600, *args, **kwargs):
    """Preview a file.
    Params
    ------
    client: agavepy.agave.Agave
        Tapis client to use.
    system: str
        Tapis system ID.
    path: str
        Path to the file.
    href: str
        Tapis href for the file to be previewed.
    max_uses: int
         Maximum amount the postit link can be used.
    lifetime: int
        Life time of the postit link in seconds.

    Returns
    -------
    dict
    """

    file_name = path.strip('/').split('/')[-1]
    file_ext = os.path.splitext(file_name)[1].lower()
    # href = client.files.list(systemId=system, filePath=path)[0]['_links']['self']['href']

    # meta_result = query_file_meta(system, os.path.join('/', path))
    # meta = meta_result[0] if len(meta_result) else {}
    meta = {}
    try:
        meta = FileMetaModel.get_by_path_and_system(system, path).value
        meta.pop("system", None)
        meta.pop("path", None)
        meta.pop("basePath", None)
        meta = {k: json.dumps(meta[k]) for k in meta}
    except FileMetaModel.DoesNotExist:
        meta = {}

    postit_result = client.files.createPostIt(systemId=system, path=path, allowedUses=max_uses, validSeconds=lifetime, headers={"X-Tapis-Tracking-ID": kwargs.get("tapis_tracking_id", "")})
    url = postit_result.redeemUrl

    if file_ext in settings.SUPPORTED_TEXT_PREVIEW_EXTS:
        if file_ext == '.hazmapper':
            file_type = 'hazmapper'
        else:
            file_type = 'text'
    elif file_ext in settings.SUPPORTED_IMAGE_PREVIEW_EXTS:
        file_type = 'image'
    elif file_ext in settings.SUPPORTED_OBJECT_PREVIEW_EXTS:
        file_type = 'object'
    elif file_ext in settings.SUPPORTED_MS_OFFICE:
        file_type = 'ms-office'
        url = 'https://view.officeapps.live.com/op/view.aspx?src={}'.\
            format(url)
    elif file_ext in settings.SUPPORTED_VIDEO_EXTS:
        file_type = 'video'
        # url = '/api/datafiles/media/agave/private/{}/{}'.format(system, path)
    elif file_ext in settings.SUPPORTED_IPYNB_PREVIEW_EXTS:
        file_type = 'ipynb'
        tmp = url.replace('https://', '')
        url = 'https://nbviewer.jupyter.org/urls/{tmp}'.format(tmp=tmp)
    else:
        file_type = 'other'

    return {'href': url, 'fileType': file_type, 'fileMeta': meta}


def download_bytes(client, system, path, *args, **kwargs):
    """Creates a postit pointing to this file.

    Params
    ------
    client: agavepy.agave.Agave
        Tapis client to use.
    system: str
    path: str
    Returns
    -------
    io.BytesIO
        BytesIO object representing the downloaded file.
    """
    file_name = os.path.basename(path)
    resp = client.files.getContents(systemId=system, path=path)
    result = io.BytesIO(resp)
    result.name = file_name
    return result

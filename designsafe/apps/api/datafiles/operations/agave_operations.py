import io
import json
import logging
import os
import urllib
from designsafe.apps.api.datafiles.utils import *
from designsafe.apps.data.models.elasticsearch import IndexedFile
from designsafe.apps.data.tasks import agave_indexer
from django.conf import settings
from elasticsearch_dsl import Q
import requests
from requests.exceptions import HTTPError

logger = logging.getLogger(__name__)


def listing(client, system, path, offset=0, limit=100, *args, **kwargs):
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
    raw_listing = client.files.list(systemId=system,
                                    filePath=urllib.parse.quote(path),
                                    offset=int(offset) + 1,
                                    limit=int(limit))

    try:
        # Convert file objects to dicts for serialization.
        listing = list(map(dict, raw_listing))
    except IndexError:
        # Return [] if the listing is empty.
        listing = []

    # Update Elasticsearch after each listing.
    # agave_listing_indexer.delay(listing)

    return {'listing': listing, 'reachedEnd': len(listing) < int(limit)}


def logentity(client, system, path, *args, **kwargs):
    """
    No-op function to allow primary entity views to be logged as listings.
    """
    return {}


def detail(client, system, path, *args, **kwargs):
    """
    Retrieve the uuid for a file by parsing the query string in _links.metadata.href
    """
    listing = client.files.list(systemId=system, filePath=urllib.parse.quote(path), offset=0, limit=1)

    href = listing[0]['_links']['metadata']['href']
    qs = urllib.parse.urlparse(href).query
    parsed_qs = urllib.parse.parse_qs(qs)['q'][0]
    qs_json = json.loads(parsed_qs)
    return {**dict(listing[0]), 'uuid': qs_json['associationIds']}


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
    if not path.endswith('/'):
        path = path + '/'
    search = IndexedFile.search()
    search = search.query(ngram_query | match_query)
    search = search.filter('prefix', **{'path._exact': path})
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
        token = client.token.token_info['access_token']
    zip_endpoint = "https://designsafe-download01.tacc.utexas.edu/check"
    data = json.dumps({'system': system, 'paths': paths})
    # data = json.dumps({'system': 'designsafe.storage.published', 'paths': ['PRJ-2889']})
    resp = requests.put(zip_endpoint, headers={"Authorization": f"Bearer {token}"}, data=data)
    resp.raise_for_status()
    download_key = resp.json()["key"]
    return {"href": f"https://designsafe-download01.tacc.utexas.edu/download/{download_key}"}


def mkdir(client, system, path, dir_name):
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
    body = {
        'action': 'mkdir',
        'path': dir_name
    }
    result = client.files.manage(systemId=system,
                                 filePath=urllib.parse.quote(path),
                                 body=body)

    agave_indexer.apply_async(kwargs={'systemId': system,
                                      'filePath': path,
                                      'recurse': False},
                              queue='indexing')
    return dict(result)


def move(client, src_system, src_path, dest_system, dest_path):
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
    # do not allow moves to the same location or across systems
    if (os.path.dirname(src_path) == dest_path.strip('/') or src_system != dest_system):
        return {
            'system': src_system,
            'path': urllib.parse.quote(src_path),
            'name': os.path.basename(src_path)
        }

    src_file_name = os.path.basename(src_path)
    try:
        client.files.list(systemId=dest_system, filePath=os.path.join(dest_path, src_file_name))
        dst_file_name = rename_duplicate_path(src_file_name)
        full_dest_path = os.path.join(dest_path.strip('/'), dst_file_name)
    except:
        dst_file_name = src_file_name
        full_dest_path = os.path.join(dest_path.strip('/'), src_file_name)

    body = {'action': 'move', 'path': full_dest_path}
    move_result = client.files.manage(
        systemId=src_system,
        filePath=urllib.parse.quote(src_path),
        body=body
    )
    update_meta(
        src_system=src_system,
        src_path=src_path,
        dest_system=dest_system,
        dest_path=full_dest_path
    )

    if os.path.dirname(src_path) != full_dest_path or src_path != full_dest_path:
        agave_indexer.apply_async(kwargs={
            'systemId': src_system,
            'filePath': os.path.dirname(src_path),
            'recurse': False
        }, queue='indexing')

    agave_indexer.apply_async(kwargs={
        'systemId': dest_system,
        'filePath': dest_path,
        'recurse': False
    }, queue='indexing')
    
    if move_result['nativeFormat'] == 'dir':
        agave_indexer.apply_async(kwargs={
            'systemId': dest_system,
            'filePath': full_dest_path,
            'recurse': True
        }, queue='indexing')

    return move_result


def copy(client, src_system, src_path, dest_system, dest_path):
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
        client.files.list(systemId=dest_system, filePath=os.path.join(dest_path, src_file_name))
        dst_file_name = rename_duplicate_path(src_file_name)
        full_dest_path = os.path.join(dest_path.strip('/'), dst_file_name)
    except:
        dst_file_name = src_file_name
        full_dest_path = os.path.join(dest_path.strip('/'), src_file_name)

    if src_system == dest_system:
        body = {'action': 'copy', 'path': full_dest_path}
        copy_result = client.files.manage(
            systemId=src_system,
            filePath=urllib.parse.quote(src_path.strip('/')), # don't think we need to strip '/' here...
            body=body
        )
    else:
        src_url = 'agave://{}/{}'.format(src_system, urllib.parse.quote(src_path))
        copy_result = client.files.importData(
            systemId=dest_system,
            filePath=urllib.parse.quote(dest_path),
            fileName=dst_file_name,
            urlToIngest=src_url
        )

    copy_meta(
        src_system=src_system,
        src_path=src_path,
        dest_system=dest_system,
        dest_path=full_dest_path
    )

    if copy_result['nativeFormat'] == 'dir':
        agave_indexer.apply_async(kwargs={
            'systemId': dest_system,
            'filePath': full_dest_path,
            'recurse': True
        }, queue='indexing')
    else:
        agave_indexer.apply_async(kwargs={
            'username': 'ds_admin',
            'systemId': dest_system,
            'filePath': dest_path,
            'recurse': False
        }, queue='indexing')

    return dict(copy_result)


def delete(client, system, path):
    return client.files.delete(systemId=system,
                               filePath=urllib.parse.quote(path))

def rename(client, system, path, new_name):
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
    listing = client.files.list(systemId=system, filePath=path)
    path = path.strip('/')
    body = {'action': 'rename', 'path': new_name}

    rename_result = client.files.manage(
        systemId=system,
        filePath=urllib.parse.quote(os.path.join('/', path)),
        body=body
    )
    update_meta(
        src_system=system,
        src_path=path,
        dest_system=system,
        dest_path=os.path.join(os.path.dirname(path), new_name)
    )

    # if rename_result['nativeFormat'] == 'dir':
    if listing[0].type == 'dir':
        agave_indexer.apply_async(
            kwargs={
                'systemId': system,
                'filePath': os.path.dirname(path),
                'recurse': False
            }, queue='indexing')
        agave_indexer.apply_async(kwargs={
                'systemId': system,
                'filePath': rename_result['path'],
                'recurse': True
        }, queue='indexing')
    else:
        agave_indexer.apply_async(
            kwargs={
                'systemId': system,
                'filePath': os.path.dirname(path),
                'recurse': False
            }, queue='indexing')

    return dict(rename_result)


def trash(client, system, path, trash_path):
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
        client.files.list(systemId=system,
                          filePath=trash_path)
    except HTTPError as err:
        if err.response.status_code != 404:
            logger.error("Unexpected exception listing .trash path in {}".format(system))
            raise
        mkdir(client, system, trash_root, trash_foldername)

    resp = move(client, system, path, system, trash_path)

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

    resp = client.files.importData(systemId=system,
                                   filePath=urllib.parse.quote(path),
                                   fileName=str(upload_name),
                                   fileToUpload=uploaded_file)

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


def preview(client, system, path, href, max_uses=3, lifetime=600, *args, **kwargs):
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
    href = client.files.list(systemId=system, filePath=path)[0]['_links']['self']['href']

    meta_result = query_file_meta(system, os.path.join('/', path))
    meta = meta_result[0] if len(meta_result) else {}

    args = {
        'url': urllib.parse.unquote(href),
        'maxUses': max_uses,
        'method': 'GET',
        'lifetime': lifetime,
        'noauth': False
    }

    postit_result = client.postits.create(body=args)
    url = postit_result['_links']['self']['href']

    if file_ext in settings.SUPPORTED_TEXT_PREVIEW_EXTS:
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


def download_bytes(client, system, path):
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
    resp = client.files.download(systemId=system, filePath=path)
    result = io.BytesIO(resp.content)
    result.name = file_name
    return result

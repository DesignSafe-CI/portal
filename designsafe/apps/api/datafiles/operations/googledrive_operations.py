import urllib
import os
import io
import magic
import datetime
from django.conf import settings
from requests.exceptions import HTTPError
import logging
from elasticsearch_dsl import Q
from googleapiclient.http import MediaIoBaseUpload, MediaIoBaseDownload
# from portal.libs.elasticsearch.indexes import IndexedFile
# from portal.apps.search.tasks import agave_indexer, agave_listing_indexer

logger = logging.getLogger(__name__)


def listing(client, system, path, offset=None, limit=100, nextPageToken=None, *args, **kwargs):

    fields = "mimeType, name, id, modifiedTime, fileExtension, size, parents"
    listing_call = client.files().list(q="'{}' in parents and trashed=False".format(path),
                                       fields="files({}), nextPageToken".format(fields), pageSize=limit, pageToken=nextPageToken)\
        .execute()
    listing = listing_call.get('files')
    scroll_token = listing_call.get('nextPageToken')
    reached_end = not bool(scroll_token)
    listing = list(map(lambda f: {
        'system': None,
        'type': 'dir' if f['mimeType'] == 'application/vnd.google-apps.folder' else 'file',
        'format': 'folder' if f['mimeType'] == 'application/vnd.google-apps.folder' else 'raw',
        'mimeType': f['mimeType'],
        'path': f['id'],
        'name': f['name'],
        'length': int(f['size']) if 'size' in f.keys() else 0,
        'lastModified': f['modifiedTime'],
    }, listing))

    return {'listing': listing, 'nextPageToken': scroll_token, 'reachedEnd': reached_end}

def iterate_listing(client, system, path, limit=100):
        scroll_token = None
        while True:
            _listing = listing(client, system, path, limit=limit, nextPageToken=scroll_token)
            
            scroll_token = _listing['nextPageToken']
            yield from _listing['listing']  

            if not scroll_token:
                break

def walk_all(client, system, path, limit=100):
    for f in iterate_listing(client, system, path, limit):
        yield f
        if f['format'] == 'folder':
            yield from walk_all(client, system, f['path'], limit)


def upload(client, system, path, uploaded_file, *args, **kwargs):
    filename = os.path.basename(uploaded_file.name)
    mimetype = magic.from_buffer(uploaded_file.getvalue(), mime=True)
    media = MediaIoBaseUpload(uploaded_file, mimetype=mimetype)
    file_meta = {
        'name': os.path.basename(uploaded_file.name),
        'parents': [path]
    }
    client.files().create(body=file_meta, media_body=media).execute()

def mkdir(client, system, path, dir_name):
    file_metadata = {
    'name': dir_name,
    'parents': [path],
    'mimeType': 'application/vnd.google-apps.folder'
    }
    newdir = client.files().create(body=file_metadata,
                                    fields='mimeType, name, id, modifiedTime, fileExtension, size, parents').execute()

    newdir_dict= {
        'system': None,
        'type': 'dir' if newdir['mimeType'] == 'application/vnd.google-apps.folder' else 'file',
        'format': 'folder' if newdir['mimeType'] == 'application/vnd.google-apps.folder' else 'raw',
        'mimeType': newdir['mimeType'],
        'path': newdir['id'],
        'name': newdir['name'],
        'length': 0,
        'lastModified': newdir['modifiedTime'],
    }

    return newdir_dict


def download(client, system, path):
    file_id = path
    file_name = client.files().get(fileId=file_id, fields="name").execute()['name']
    request = client.files().get_media(fileId=file_id)
    fh = io.BytesIO()
    downloader = MediaIoBaseDownload(fh, request)
    done = False
    while done is False:
        status, done = downloader.next_chunk()

    fh.name = file_name
    return fh

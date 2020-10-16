from boxsdk.object.folder import Folder
from boxsdk.object.file import File
from boxsdk.exception import BoxAPIException
import io
import logging
logger = logging.getLogger(__name__)

def listing(client, system, path, offset=0, limit=100, *args, **kwargs):
    offset = int(offset)
    limit = int(limit)  

    if not path:
        folder = client.root_folder()
    else:
        folder = client.folder(folder_id=path)

    items = folder.get_items(limit=limit, offset=offset, fields=['name', 'size', 'type', 'modified_at', 'id'])
    mapped_items = map(lambda f: {
        'system': None,
        'type': 'dir' if f.type == 'folder' else 'file',
        'format': 'folder' if f.type == 'folder' else 'raw',
        'mimeType': f.type,
        'path': f.id,
        'name': f.name,
        'length': f.size,
        'lastModified': f.modified_at,

    }, items)

    return {'listing': list(mapped_items)}

def iterate_listing(client, system, path, limit=100):
    offset = 0

    while True:
        page = listing(client, system, path, offset, limit)['listing']
        yield from page
        offset += limit
        if len(page) != limit:
            # Break out of the loop if the listing is exhausted.
            break

def preview(client, system, path, *args, **kwargs):
    embed_url = client.file(path).get_embed_url()
    return {'href': embed_url, 'fileType': 'box'}

def copy(client, src_system, src_path, dest_system, dest_path, filetype='file', *args, **kwargs):
    if not dest_path:
        destination_folder = client.root_folder()
    else:
        destination_folder = client.folder(dest_path)

    if filetype == 'file':
        file_to_copy = client.file(src_path)
    elif filetype == 'dir':
        file_to_copy = client.folder(src_path)

    file_copy = file_to_copy.copy(destination_folder)

    return {}

def download_bytes(client, system, path):
    filename = client.file(path).get().name
    resp = client.file(path).content()
    result = io.BytesIO(resp)
    result.name = filename
    return result

def upload(client, system, path, uploaded_file):
    if not path:
        folder = client.root_folder()
    else:
        folder = client.folder(path)

    folder.upload_stream(uploaded_file, file_name=uploaded_file.name)
    return {}

def mkdir(client, system, path, dirname):
    if not path:
        folder = client.root_folder()
    else:
        folder = client.folder(folder_id=path)

    newdir = folder.create_subfolder(dirname)

    return {'name': dirname, 'path': newdir.id}


    
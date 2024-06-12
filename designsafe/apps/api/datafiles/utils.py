import datetime
import json
import logging
import os
import re
from copy import deepcopy
import exifread
from celery import shared_task
from designsafe.apps.api.agave import service_account
from PIL import Image

logger = logging.getLogger(__name__)

ALLOWED_IMAGE_TYPES = ['png', 'gif', 'jpg', 'jpeg', 'webp']
ALLOWED_RAW_TYPES = ['tiff', 'raw', 'arw', 'cr2', 'crw', 'nef', 'orw', 'dng']
# ALLOWED_AUDIO_TYPES = ['mp3', 'mp4', 'm4a', 'wav']
# ALLOWED_VIDEO_TYPES = ['webm', 'ogg', 'mp4', 'wav', 'webm']
# ALLOWED_GEO_TYPES = ['gml', 'gfs', 'kml', 'geojson']

def file_meta_obj(path, system, meta):
    """
    Default object for file metadata creation
    ** We need to take in meta through the "meta" param as kwargs
    could have key overlap
    """
    defaults = {
        'associationIds': [],
        'schemaId': None,
        'name': 'designsafe.file',
        'value': meta
    }
    defaults['value']['system'] = system
    defaults['value']['path'] = path
    defaults['value']['basePath'] = os.path.dirname(path)
    return defaults


def rename_duplicate_path(file_name):
    """
    Append timestamp to file name
    """
    _ext = os.path.splitext(file_name)[1].lower()
    _name = os.path.splitext(file_name)[0]
    now = datetime.datetime.utcnow().strftime('%Y-%m-%d %H-%M-%S')
    return '{}_{}{}'.format(_name, now, _ext)


def query_file_meta(system, path):
    """
    Return all metadata objects starting with a given path
    and matching a system exactly
    """
    sa_client = service_account()
    query = {
        "name": "designsafe.file",
        "value.system": system,
        "value.path": os.path.join('/', path, '*')
    }
    
    all_results = []
    offset = 0

    while True:
        result = sa_client.meta.listMetadata(q=json.dumps(query), limit=300, offset=offset)
        all_results = all_results + result
        offset += 300
        if len(result) != 300:
            break
    
    return all_results


def scrape_metadata_from_file(file):
    """
    Get standard metadata from a file to display to user...
    """
    metadata = {}
    file_ext = os.path.splitext(file.name)[1].lower().strip('.')

    if file_ext in ALLOWED_RAW_TYPES:
        tags = exifread.process_file(file, details=False)
        for key, value in tags.items():
            metadata[key] = str(value)
    elif file_ext in ALLOWED_IMAGE_TYPES:
        img = Image.open(file.file)
        metadata = {
            "format": img.format,
            "mode": img.mode,
            "width": img.width,
            "height": img.height,
            "info": img.info # can contain non-human-readable data
        }
    else:
        return {}

    return metadata

def create_or_update_meta(client, meta_body):
    existing_meta = query_file_meta(meta_body["value"]["system"], meta_body["value"]["path"])
    if not existing_meta:
        return client.meta.addMetadata(body=json.dumps(meta_body))
    existing_uuid = existing_meta[0]["uuid"]
    return client.meta.updateMetadata(uuid=existing_uuid, body=meta_body)


@shared_task(autoretry_for=(Exception,), retry_kwargs={'max_retries': 3})
def update_meta(src_system, src_path, dest_system, dest_path):
    """
    Check for and update metadata record(s)
    """
    sa_client = service_account()

    updates = []
    meta_listing = query_file_meta(system=src_system, path=src_path)
    if meta_listing:
        for meta in meta_listing:
            meta_dict = deepcopy(dict(meta))
            new_path = meta_dict['value']['path'].replace(src_path.rstrip("/"), dest_path, 1)
            if not new_path.startswith("/"):
                new_path = f"/{new_path}"
            
            new_meta_value = {**meta_dict["value"],
                                   "system": dest_system,
                                   "path": new_path,
                                   "basePath": os.path.dirname(new_path)}

            meta_body = {"name": "designsafe.file", "value": new_meta_value}
            updates.append({"uuid": meta_dict["uuid"], "body": meta_body})
        
        for update in updates:
            sa_client.meta.updateMetadata(uuid=update["uuid"], body=json.dumps(update["body"]))


@shared_task(autoretry_for=(Exception,), retry_kwargs={'max_retries': 3})
def copy_meta(src_system, src_path, dest_system, dest_path):
    """
    Check for and copy metadata record(s)
    """
    sa_client = service_account()

    copies = []
    meta_listing = query_file_meta(system=src_system, path=src_path)
    if meta_listing:
        for meta in meta_listing:
            meta_dict = deepcopy(dict(meta))
            new_path = meta_dict['value']['path'].replace(src_path.rstrip("/"), dest_path, 1)
            if not new_path.startswith("/"):
                new_path = f"/{new_path}"
            
            copy_meta_value = {**meta_dict["value"],
                                   "system": dest_system,
                                   "path": new_path,
                                   "basePath": os.path.dirname(new_path)}

            meta_body = {"name": "designsafe.file", "value": copy_meta_value}
            copies.append(meta_body)

        for copy in copies:
            create_or_update_meta(sa_client, copy)


def create_meta(path, system, meta):
    """
    Create metadata for a file.
    """
    sa_client = service_account()
    meta_body = file_meta_obj(
        path=path,
        system=system,
        meta=meta
    )
    sa_client.meta.addMetadata(body=json.dumps(meta_body))

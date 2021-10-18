import json
import logging
import os
import re
import exifread
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
    return defaults


def increment_file_name(listing, file_name):
    """
    Check and append a number in parens to the end of
    a file name which exists in the provided file listing
    """
    if any(x['name'] for x in listing if x['name'] == file_name):
        inc = 1
        _ext = os.path.splitext(file_name)[1]
        _name = os.path.splitext(file_name)[0]
        _inc = "({})".format(inc)
        file_name = '{}{}{}'.format(_name, _inc, _ext)

        while any(x['name'] for x in listing if x['name'] == file_name):
            inc += 1
            _inc = "({})".format(inc)
            file_name = '{}{}{}'.format(_name, _inc, _ext)
    return file_name


def query_file_meta(system, path):
    """
    Return all metadata objects starting with a given path
    and matching a system exactly
    """
    client = service_account()
    query = {
        "name": "designsafe.file",
        "value.system": system,
    }
    re_path = re.escape(os.path.join('/', path))
    query['value.path'] = {'$regex': '^{}'.format(re_path)}
    
    all_results = []
    offset = 0

    while True:
        # Need to find out what the hard limit is on this... Steve T mentioned it might
        # be related to the byte size of the response object.
        result = client.meta.listMetadata(q=json.dumps(query), limit=500, offset=offset)
        all_results = all_results + result
        offset += 500
        if len(result) != 500:
            break
    
    return all_results


def scrape_meta(file):
    """
    Get standard metadata from a file to display to user...
    """
    metadata = {}
    file_ext = os.path.splitext(file.name)[1].lower().strip('.')

    if file_ext in ALLOWED_RAW_TYPES:
        tags = exifread.process_file(file, details=False) #details=False to remove thumbnail...
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
        return None

    return metadata

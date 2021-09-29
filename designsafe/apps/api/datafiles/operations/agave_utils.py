import json
import os
import re
from designsafe.apps.api.agave import service_account


def file_meta_obj(path, system, meta):
    """
    Base object for file metadata creation
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


def create_test_meta(file_listing):
    """
    Create test metadata for files in a listing...


    listing = client.files.list(filePath='/data/static1', systemId='Aloe-storage-testuser5')
    /home/testuser5/data/static1
    /home/testuser5/data/static1/static1.txt
    /home/testuser5/data/static1/static2.txt

    import json
    import logging
    import urllib.parse
    from designsafe.apps.api.agave import test_account_client
    from designsafe.apps.api.datafiles.operations.agave_utils import create_test_meta, file_meta_obj
    """
    # path = '/data/static1'
    # system = 'Aloe-storage-testuser5'
    # client = test_account_client()
    client = service_account()

    create_list = []
    for file in file_listing:
        if file.type != 'dir':
            create_list.append(file_meta_obj(system=file.system, path=file.path, **{'test': True}))
    
    res = client.meta.bulkCreate(body=json.dumps(create_list))
    return res

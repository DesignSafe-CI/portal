import json
import logging
import urllib.parse
from designsafe.apps.api.agave import test_account_client

logger = logging.getLogger(__name__)

def file_meta_obj(path, system, file_uuid=None, **kwargs):
    """
    Base object for file metadata creation
    """
    defaults = {
        'associationIds': [],
        'schemaId': None,
        'name': 'designsafe.file',
        'value': kwargs
    }
    if file_uuid:
        defaults['associationIds'] = [file_uuid]
        defaults['value']['fileUuid'] = file_uuid
    defaults['value']['system'] = system
    defaults['value']['path'] = path
    return defaults


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
    client = test_account_client()

    create_list = []
    for file in file_listing:
        if file.type != 'dir':
            create_list.append(file_meta_obj(system=file.system, path=file.path, **{'test': True}))
    
    res = client.meta.bulkCreate(body=json.dumps(create_list))
    return res

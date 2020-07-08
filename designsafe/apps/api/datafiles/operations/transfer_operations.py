from designsafe.apps.api.datafiles.operations import agave_operations
from designsafe.apps.api.datafiles.operations import googledrive_operations

api_mapping = {
    'googledrive': {
        'upload': googledrive_operations.upload,
        'download': googledrive_operations.download,
        'iterate_listing': googledrive_operations.iterate_listing,
        'mkdir': googledrive_operations.mkdir
    },
    'agave': {
        'upload': agave_operations.upload,
        'download': agave_operations.download_bytes,
        'iterate_listing': agave_operations.iterate_listing,
        'mkdir': agave_operations.mkdir
    }
}


def transfer(src_client, dest_client, src_api, dest_api, src_system, dest_system, src_path, dest_path, *args, **kwargs):

    _download = api_mapping[src_api]['download']
    _upload = api_mapping[dest_api]['upload']

    file_bytes = _download(src_client, src_system, src_path)
    file_upload = _upload(dest_client, dest_system, dest_path, file_bytes)

    return


def transfer_folder(src_client, dest_client, src_api, dest_api, src_system, dest_system, src_path, dest_path, dirname, *args, **kwargs):
    _iterate_listing = api_mapping[src_api]['iterate_listing']
    _download = api_mapping[src_api]['download']
    _upload = api_mapping[dest_api]['upload']
    _mkdir = api_mapping[dest_api]['mkdir']

    newdir = _mkdir(dest_client, dest_system, dest_path, dirname)
    for f in _iterate_listing(src_client, src_system, src_path):
        if f['format'] == 'folder':
            transfer_folder(src_client, dest_client, src_api, dest_api, src_system, dest_system, f['path'], newdir['path'], f['name'])
        else:
            file_bytes = _download(src_client, src_system, f['path'])
            file_upload = _upload(dest_client, dest_system, newdir['path'], file_bytes)
            

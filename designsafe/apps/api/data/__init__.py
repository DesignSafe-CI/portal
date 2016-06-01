from designsafe.apps.api.data.agave.filemanager import (
    FileManager as AgaveFileManager)
from designsafe.apps.api.data.agave.public_filemanager import (
    FileManager as PublicFileManager)
from designsafe.apps.api.data.box.filemanager import FileManager as BoxFileManager
from designsafe.apps.api.tasks import box_download, box_upload, copy_public_to_mydata

def lookup_file_manager(resource):
    if resource == 'public':
        return PublicFileManager
    elif resource == 'box':
        return BoxFileManager
    elif resource == 'agave':
        return AgaveFileManager
    else:
        return None


def lookup_transfer_service(src_resource, dest_resource):
    if src_resource == 'box':
        if dest_resource == 'agave':
            return box_download

    if src_resource == 'agave':
        if dest_resource == 'box':
            return box_upload

    if src_resource == 'public':
        if dest_resource == 'box':
            return box_upload
        elif dest_resource == 'agave':
            return copy_public_to_mydata

    return None

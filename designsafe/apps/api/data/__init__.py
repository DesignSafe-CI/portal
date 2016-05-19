from designsafe.apps.api.data.agave.filemanager import (
    FileManager as AgaveFileManager)
from designsafe.apps.api.data.agave.public_filemanager import (
    FileManager as PublicFileManager)
from designsafe.apps.api.data.box.filemanager import FileManager as BoxFileManager


def lookup_file_manager(resource):
    if resource == 'public':
        return PublicFileManager
    elif resource == 'box':
        return BoxFileManager
    elif resource == 'agave':
        return AgaveFileManager
    else:
        return None

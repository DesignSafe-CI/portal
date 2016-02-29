from designsafe.libs.elasticsearch.api import Object
from dsapi.agave.daos import AgaveFolderFile, AgaveMetaFolderFile, AgaveFilesManager

def list_meta_path(agave_client, username, system_id, file_path, special_dir):
    manager = AgaveFilesManager(agave_client)
    if file_path == username:
        manager.check_shared_folder(system_id = system_id, 
                                username = username)
    #l = manager.list_meta_path(system_id = self.filesystem, 
    #                            path = self.file_path, 
    #                            special_dir = self.special_dir, 
    #                            username = request.user.username)
    paths = file_path.split('/') 
    if special_id == shared_with_me and path == '/':
      pass

from agavepy.agave import AgaveException, Agave
from agavepy.async import AgaveAsyncResponse, TimeoutError, Error
from designsafe.apps.api.exceptions import ApiException
from designsafe.apps.api.data.agave.agave_object import AgaveObject
from designsafe.apps.api.data.agave.file import AgaveFile
from designsafe.apps.api.data.abstract.filemanager import AbstractFileManager
from designsafe.apps.api.data.agave.decorators import file_id_parser
from designsafe.apps.api.data.agave.elasticsearch.documents import Object
from django.conf import settings
from functools import wraps
import os
import logging
logger = logging.getLogger(__name__)

FILESYSTEMS = {
    'default': getattr(settings, 'AGAVE_STORAGE_SYSTEM')
}

class FileManager(AbstractFileManager, AgaveObject):

    resource = 'agave'

    def __init__(self, user_obj, **kwargs):
        super(FileManager, self).__init__(**kwargs)
        username = user_obj.username
        if user_obj.agave_oauth.expired:
            user_obj.agave_oauth.refresh()

        token = user_obj.agave_oauth
        access_token = token.access_token
        agave_url = getattr(settings, 'AGAVE_TENANT_BASEURL')
        self.agave_client = Agave(api_server = agave_url, 
                                  token = access_token)
        self.username = username

    def is_shared(self, file_id):
        file_id = self.parse_file_id(file_id)
        return not (file_id[0] == settings.AGAVE_STORAGE_SYSTEM and file_id[1] == self.username)
    
    def _agave_listing(self, system, file_path):
        listing = self.call_operation('files.list',
                                      systemId=system,
                                      filePath=file_path)

        root_listing = AgaveFile(wrap=listing[0])
        list_data = root_listing.to_dict()
        if len(listing) > 1:
            list_data['children'] = [AgaveFile(wrap=o).to_dict() for o in listing[1:]]
        else:
            list_data['children'] = []
        return list_data

    def _es_listing(self, system, username, file_path):
        res, listing = Object.listing(system, username, file_path)
        root_listing = Object.from_file_path(system, username, file_path)
        if system == settings.AGAVE_STORAGE_SYSTEM and file_path == '/':
            list_data = {
                    '_tail': [],
                    '_actions': [],
                    '_pems': [],
                    'id': '$share',
                    'path': '',
                    'name': 'Shared with me'
                }
            list_data['children'] = [o.to_file_dict() for o in listing.scan() if o.name != username]
        else:
            list_data = root_listing.to_file_dict()
            list_data['children'] = [o.to_file_dict() for o in listing.scan()]
        return list_data

    def parse_file_id(self, file_id):
        """
        Returns `system_id`, `file_user` and `file_path` from a
        `file_id` string.

        Examples:
            `file_id` can look like this:
              `designsafe.storage.default`:
              Points to the root folder in the 
              `designsafe.storage.default` filesystem.

              `designsafe.stroage.default/username`:
              Points to the home directory of the user `username`.

              `designsafe.storage.default/username/folder`:
              Points to the folder `folder` in the home directory
              of the user `username`.

              `designsafe.stroage.default/username/folder/file.txt`:
              Points to the file `file.txt` in the home directory
              of the username `username`
        
        Args:
            file_id: String with the format 
            <filesystem id>[ [ [/ | /<username> [/ | /<file_path>] ] ] ]

        Returns:
            A list with three elements
            index 0 `system_id`: String. Filesystem id 
            index 1 `file_user`: String. Home directory's username of the 
                                 file the `file_id` points to.
            index 2 `file_path`: String. Complete file path.

        Raises:
            ValueError: If the object is not in the desired format.

        """
        if file_id is None or file_id == '':
            system_id = settings.AGAVE_STORAGE_SYSTEM
            file_path = self.username
            file_user = self.username
        else: 
            components = file_id.strip('/').split('/')
            system_id = components[0] if len(components) >= 1 else None
            file_path = '/'.join(components[1:]) if len(components) >= 2 else self.username
            file_user = components[1] if len(components) >= 2 else self.username

        return system_id, file_user, file_path
        
    def listing(self, file_id, **kwargs):
        """
        Lists contents of a folder or details of a file.

        Args:
            system: String. System id.
            file_path: String. 
            file_user: String. home directory's user of the file we're listing.

        Returns:
            listing dictionary. A dictionary with the properties of the 
            parent path file object plus a `children` key with an array 
            of the listing's file objects.
            If the `file_id` passed is a file and not a folder the 
            `children` array will be empty.

        Examples:
            A listing dictionary:
            ```{
                  _pems: [ ],
                  type: "folder",
                  path: "",
                  id: "designsafe.storage.default/path/folder",
                  size: 32768,
                  name: "username",
                  lastModified: "2016-04-26T22:25:30-0500",
                  system: "designsafe.storage.default",
                  children: [],
                  source: "agave",
                  ext: "",
                  _actions: [ ],
                  _trail: [ ]
                }
            ```

            To loop through the listing's files:
            >>> listing = fm.listing(**kwargs)
            >>> for child in listing['children']: 
            >>>     do_something_cool(child)
        """
        system, file_user, file_path = self.parse_file_id(file_id)
        if file_path.lower() == '$share':
            file_path = '/'
            file_user = self.username
        listing = self._es_listing(system, self.username, file_path)
        if not listing:
            listing = self._agave_listing(system, file_path)
        return listing

    def search(self, **kwargs):
        return [{}]

    def download(self, **kwargs):
        pass

    def copy(self, system, file_path, file_user, path, **kwargs):
        f = AgaveFile.from_file_path(system, self.username, file_path,
                    agave_client = self.agave_client)
        f.copy(path)
        esf = Object.from_file_path(system, self.username, file_path)
        esf.copy(self.username, path)
        return f.to_dict()

    def delete(self, system, file_path, file_user, path, **kwargs):
        f = AgaveFile.from_file_path(system, self.username, file_path,
                    agave_client = self.agave_client)
        f.delete()
        esf = Object.from_file_path(system, self.username, file_path)
        esf.delete_recursive()
        return f.to_dict()

    def file(self, file_id, action, path = None, **kwargs):
        system, file_user, file_path = self.parse_file_id(file_id)

        file_op = getattr(self, action)
        return file_op(system, file_path, file_user, path, **kwargs)

    def move(self, system, file_path, file_user, path, **kwargs):
        f = AgaveFile.from_file_path(system, self.username, file_path, 
                    agave_client = self.agave_client)
        f.move(path)
        esf = Object.from_file_path(system, self.username, file_path)
        esf.move(self.username, path)
        return f.to_dict()

    def move_to_trash(self, system, file_path, file_user, path, **kwargs):
        trash = Object.from_file_path(system, self.username, 
                                os.path.join(self.username, '.Trash'))
        if trash is None:
            f_dict = self.mkdir(system, self.username, file_user, 
                            os.path.join(self.username, '.Trash'), **kwargs) 
        tail, head = os.path.split(file_path)
        ret = self.move(system, file_path, file_user, os.path.join(self.username, '.Trash', head))
        return ret

    def mkdir(self, system, file_path, file_user, path, **kwargs):
        f = AgaveFile.mkdir(system, self.username, file_path, path,
                    agave_client = self.agave_client)
        logger.debug('f: {}'.format(f.to_dict()))
        esf = Object.from_agave_file(self.username, f)
        return f.to_dict()

    def rename(self, system, file_path, file_user, path, **kwargs):
        f = AgaveFile.from_file_path(system, self.username, file_path,
                    agave_client = self.agave_client)
        f.rename(path)
        esf = Object.from_file_path(system, self.username, file_path)
        esf.rename(self.username, path)
        return f.to_dict()


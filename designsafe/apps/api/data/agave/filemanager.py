from agavepy.agave import Agave
from designsafe.apps.api.exceptions import ApiException
from designsafe.apps.api.data.agave.file import AgaveFile
from designsafe.apps.api.tasks import reindex_agave, share_agave
from designsafe.apps.api.data.agave.agave_object import AgaveObject
from designsafe.apps.api.data.agave.elasticsearch.documents import Object
from designsafe.apps.api.notifications.models import Notification, Broadcast
from designsafe.apps.api.data.abstract.filemanager import AbstractFileManager
from django.core.exceptions import ObjectDoesNotExist
from django.contrib.auth import get_user_model
from django.core.urlresolvers import reverse
from django.conf import settings
from requests import HTTPError
import logging
import datetime
import os
import urllib2
import chardet


logger = logging.getLogger(__name__)
metrics = logging.getLogger('metrics')

FILESYSTEMS = {
    'default': getattr(settings, 'AGAVE_STORAGE_SYSTEM')
}


class FileManager(AbstractFileManager, AgaveObject):
    resource = 'agave'
    mount_path = '/corral-repl/tacc/NHERI/shared'

    def __init__(self, user_obj, **kwargs):
        """Intializes an instance of the class.

        the `__init__` method of the superclass is called because
        this class subclasses AgaveObject which sets `self.agave_client`
        AND `self._wrap`. The latter is not used in this class.
        Here we're only initializing the agave client.

        :param django.contrib.auth.models.User user_obj:
            The user object from the django user model.
        """
        super(FileManager, self).__init__(**kwargs)

        if user_obj.is_anonymous():
            raise ApiException(status=403,
                               message='Log in required to access these files.')

        username = user_obj.username

        self.agave_client = user_obj.agave_oauth.client
        self.username = username
        self._user = user_obj
        self.indexer = AgaveIndexer(agave_client = self.agave_client)

    def is_shared(self, file_id):
        """Checks if the `file_id` is shared for the file manager's user.

        TODO: Should this be a static method? or an AgaveFile's
              method `AgaveFile.check_shared(user, file_id)`

        :param str file_id: File identificator

        :return: True if the file is shared with the current user.
                 Otherwise False
        :rtype: bool

        Notes:
        -----

            The check is if the file is in the default agave storage system
            and if the file lives in the user's home directory. If both of
            these checks are False then it is assumed is a shared file for
            the user.
        """
        if file_id is None:
            return False
        parsed_file_id = self.parse_file_id(file_id)
        logger.debug('parsed_file_id: {}'.format(parsed_file_id))
        return not (parsed_file_id[0] == settings.AGAVE_STORAGE_SYSTEM and
                    (parsed_file_id[1] == self.username or self.is_search(file_id)) )

    def is_search(self, file_id):
        """Checks if `file_id` is a search path

        For this file manager when a search is executed the path will always
        end on **$SHARE**

        :param str file_id: File identificator

        :return: True if the path is a search path

        :rtype: bool
        """
        if file_id is None:
            return False

        return  file_id.strip('/').split('/')[-1] == '$SEARCH'

    def _agave_listing(self, system, file_path, **kwargs):
        """Returns a "listing" dict constructed with the response from Agave.

        :param str sytem: System id
        :param str file_path: Path to list

        :returns: A dict with information of the listed file and, when possible,
        a list of :class:`~designsafe.apps.api.data.agave.files.AgaveFile` objects
        dict in the key ``children``
        :rtype: dict

        Notes:
        -----

            This should not be called directly. See py:meth:`listing(file_id)`
            for more information.
        """
        listing = AgaveFile.listing(system, file_path, self.agave_client, **kwargs)
        logger.debug('listing: {}'.format(listing))

        root_file = filter(lambda x: x.full_path == file_path, listing)
        logger.debug('root_file: {}'.format(root_file[0]))

        list_data = root_file[0].to_dict()
        list_data['children'] = [o.to_dict() for o in listing if o.full_path != file_path]

        return list_data

    def _es_listing(self, system, username, file_path, **kwargs):
        """Returns a "listing" dict constructed with the response from Elasticsearch.

        :param basestring system: system id
        :param basestring username: username which is requesting the listing.
                             This is to check the permissions in the ES docs.
        :param basestring file_path: path to list

        :returns: A dict with information of the listed file and, when possible,
        a list of :class:`~designsafe.apps.api.data.agave.elasticsearch.documents.Object` objects
        dict in the key ``children``
        :rtype: dict

        Notes:
        -----

            This should not be called directly. See py:meth:`listing(file_id)`
            for more information.
        """
        listing_owner = file_path.strip('/').split('/')[0]
        is_shared = listing_owner != username
        if file_path != '/' and not is_shared:
            res, listing = Object.listing(system, username, file_path, **kwargs)
        else:
            res, listing = Object.listing_recursive(system, username, file_path, **kwargs)

        logger.debug('file_id: {}'.format(file_path))

        if system == settings.AGAVE_STORAGE_SYSTEM and file_path == '/':
            list_data = {
                'source': self.resource,
                'system': settings.AGAVE_STORAGE_SYSTEM,
                'id': '$share',
                'type': 'folder',
                'name': '$SHARE',
                'path': '',
                'ext': '',
                'size': None,
                'lastModified': None,
                'children': [o.to_file_dict() for o in listing if o.name != username],
                '_trail': [],
                '_pems': [{'username': self.username, 'permission': {'read': True}}],
                'shared': is_shared
            }
        else:
            root_listing = Object.from_file_path(system, listing_owner, file_path)
            if root_listing:
                list_data = root_listing.to_file_dict()
                list_data['children'] = [o.to_file_dict() for o in listing]
                list_data['shared'] = is_shared
            else:
                list_data = None

        return list_data

    def parse_file_id(self, file_id):
        """Parses a `file_id`.

        :param str file_id: String with the format
        <filesystem id>[/ | /<username> [/ | /<file_path>] ]

        :returns: a list with three elements

            * index 0 `system_id`: String. Filesystem id
            * index 1 `file_user`: String. Home directory's username of the
                                 file the `file_id` points to.
            * index 2 `file_path`: String. Complete file path.
        :rtype: list

        :raises ValueError: if the object is not in the desired format

        Examples:
        --------
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
        """
        if file_id is None or file_id == '':
            system_id = settings.AGAVE_STORAGE_SYSTEM
            file_path = self.username
            file_user = self.username
        else:
            components = file_id.strip('/').split('/')
            system_id = components[0] if len(components) >= 1 else settings.AGAVE_STORAGE_SYSTEM
            file_path = '/'.join(components[1:]) if len(components) >= 2 else self.username
            file_user = components[1] if len(components) >= 2 else self.username

        return system_id, file_user, file_path

    def listing(self, file_id=None, **kwargs):
        """
        Lists contents of a folder or details of a file.

        :param str file_id: id representing the file. Format:
        <filesystem id>[/ | /<username> [/ | /<file_path>] ]

        :returns:listing dict. A dict with the properties of the
        parent path file object plus a `childrens` key with a list
        of :class:`~.
        If the `file_id` passed is a file and not a folder the
        `children` list will be empty.
        :rtype: dict

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
        reindex = kwargs.get('reindex', None) == 'true'
        index_pems = kwargs.get('pems', None) == 'true'

        if file_path.lower() == '$share':
            file_path = '/'
            file_user = self.username

        if reindex:
            logger.debug('Update files index for {}'.format(file_path))
            logger.debug('pems_indexing: {}'.format(index_pems))
            self.indexer.index(system, file_path, file_user, levels=1,
                               full_indexing=True,
                               pems_indexing=index_pems)
        try:
            listing = self._es_listing(system, self.username, file_path, **kwargs)
        except Exception as e:
            logger.debug('Error listing from Elasticsearch, falling back to agave.', exc_info=True)
            listing = None

        fallback = listing is None or (
            listing['type'] == 'folder' and
            listing['id'] != '$share' and
            len(listing['children']) == 0)
        if fallback:
            es_listing = listing.copy() if listing is not None else None
            try:
                listing = self._agave_listing(system, file_path, **kwargs)
                reindex_agave.apply_async(kwargs = {'username': self.username,
                                                    'file_id': file_id,
                                                    'levels': 1},
                                                    queue='indexing')
            except IndexError:
                listing = es_listing
        return listing

    def copy(self, file_id, dest_resource, dest_file_id, **kwargs):
        """Copies a file

        Copies a file in both the Agave filesystem and the
        Elasticsearch index.

        :param str file_id:
        :param str dest_resource:
        :param str dest_file_id:

        :returns: dict representation of the original
            :class:`~designsafe.apps.api.data.agve.file.AgaveFile` instance
        :rtype: dict

        **Examples**
            Copy a file. `fm` is an instance of FileManager

            >>> fm.copy(file_id='designsafe.storage.default/username/file.jpg',
            ...         dest_resource='agave',
            ...         dest_file_id='designsafe.storage.default/username/file_copy.jpg')
        """
        if dest_resource == self.resource:
            system, file_user, file_path = self.parse_file_id(file_id)
            dest_system, dest_file_user, dest_file_path = self.parse_file_id(dest_file_id)
            source_file = AgaveFile.from_file_path(system, file_user, file_path,
                                                   agave_client=self.agave_client)
            if dest_system == system:
                dest_full_path = os.path.join(dest_file_path, source_file.name)
                logger.debug('copying {} to {}'.format(file_id, dest_full_path))
                copied_file = source_file.copy(dest_full_path)
                esf = Object.from_file_path(system, file_user, file_path)
                esf.copy(dest_file_user, dest_full_path)
                return copied_file.to_dict()

            else:
                agave_url = 'agave://{}'.format(os.path.join(system, file_path))
                logger.debug('importing %s to %s', agave_url, dest_file_id)
                return self.import_file(dest_file_id, source_file.name, agave_url)
        else:
            return self.transfer(file_id, dest_resource, dest_file_id)

    def delete(self, file_id, **kwargs):
        """Deletes a file

        Deletes a file in both the Agave filesystem and the
        Elasticsearch index.

        :param str system: system id
        :param str file_path: full path to the file to copy
        :param str file_user: username of the owner of the file

        :returns: dict representation of the target
        :class:`designsafe.apps.api.data.agve.file.AgaveFile` instance
        :rtype: dict

        Examples:
        --------
            Delete a file. `fm` is an instance of FileManager
            >>> fm.delete(system = 'designsafe.storage.default',
            >>>         path = 'username/.Trash/file.jpg',
            >>>         file_user = 'username')
        """
        system, file_user, file_path = self.parse_file_id(file_id)

        f = AgaveFile.from_file_path(system, self.username, file_path,
                    agave_client = self.agave_client)
        f.delete()

        esf = Object.from_file_path(system, file_user, file_path)
        esf.delete_recursive(file_user)
        return True

    def download(self, file_id, **kwargs):
        """Get the download link for a file

        :param str file_id: String with the format
        <filesystem id>[/ | /<username> [/ | /<file_path>] ]

        :returns: a dict with a single key `href` which has the direct
            noauth link to download a file
        :rtype: dict

        """
        system, file_user, file_path = self.parse_file_id(file_id)

        f = AgaveFile.from_file_path(system, self.username, file_path,
                    agave_client = self.agave_client)
        if f.type == 'file':
            postit = f.create_postit(force=True, max_uses=10, lifetime=3600)
            return {'href': postit['_links']['self']['href']}
        else:
            raise ApiException(message='Folders cannot be downloaded directly',
                               status=400)

    #TODO: we don't need this method anymore
    def file(self, file_id, action, path = None, **kwargs):
        """Main routing method for file actions

        :param str file_id: String with the format
            <filesystem id>[/ | /<username> [/ | /<file_path>] ]
        :param str action: action to execute. Must be a valid method name
        :param str path: target path to use. Optional

        :returns: see the independent methods for the returned value. Usually
            the return value is a dict representation of the file to which the
            operation is being applied.

        Notes:
        -----
            This method should be used when doing any of these file operations:

                * copy
                * delete
                * move
                * move_to_trash
                * mkdir
                * rename

            The `action` param should be any of the previous operations.
        """
        system, file_user, file_path = self.parse_file_id(file_id)

        file_op = getattr(self, action)
        return file_op(system, file_path, file_user, path, **kwargs)

    def import_file(self, file_id, file_name, remote_url, **kwargs):
        """
        Import a file from a remote url. Supported schemes include agave://, http://,
        https://.

        :param file_id: The agave file_id to import to
        :param file_name: The name to assign the file upon import
        :param remote_url: The URL of the remote data to import
        :return:
        """
        system, file_user, file_path = self.parse_file_id(file_id)

        args = {
            'systemId': system,
            'filePath': file_path,
            'fileName': file_name,
            'urlToIngest': remote_url
        }
        try:
            resp = self.call_operation('files.importData', args)
            return resp
        except Exception as e:
            raise ApiException('Import failed', status=400,
                               extra={'operation': 'files.importData', 'arguments': args})

    def move(self, file_id, dest_resource, dest_file_id, **kwargs):
        """Move a file

        Moves a file both in the Agave filesystem and the
        Elasticsearch index.

        :param str file_id: the file id in the format
            <filesystem id>[/ | /<username> [/ | /<file_path>] ]
        :param str dest_resource: destination resource
        :param str dest_file_id: destination file id

        :returns: dict representation of the
            :class:`designsafe.apps.api.data.agve.file.AgaveFile` instance
        :rtype: dict

        .. note:: this method only moves files from folder to folder
            in the same file system. For moving files between file systems
            see py:meth:`copy`
        """
        if dest_resource == self.resource:
            system, file_user, file_path = self.parse_file_id(file_id)
            dest_system, dest_file_user, dest_file_path = self.parse_file_id(dest_file_id)
            if dest_system == system:
                f = AgaveFile.from_file_path(system, file_user, file_path,
                                             agave_client=self.agave_client)
                dest_full_path = os.path.join(dest_file_path, f.name)
                f.move(dest_full_path)
                esf = Object.from_file_path(system, file_user, file_path)
                esf.move(dest_file_user, dest_full_path)
                return f.to_dict()
            else:
                raise ApiException('Use transfer to move files between systems',
                                   status=400,
                                   extra={'file_id': file_id,
                                          'dest_resource': dest_resource,
                                          'dest_file_id': dest_file_id})
        else:
            raise ApiException('Use transfer to move files between resources',
                               status=400,
                               extra={'file_id': file_id,
                                      'dest_resource': dest_resource,
                                      'dest_file_id': dest_file_id})

    def move_to_trash(self, file_id, **kwargs):
        """Move a file into the trash folder

        Moves a file both in the Agave filesystem and the
        Elasticsearch index.

        :param str file_id: the file id in the format
            <filesystem id>[/ | /<username> [/ | /<file_path>] ]

        :returns: dict representation of the
            :class:`designsafe.apps.api.data.agve.file.AgaveFile` instance
        :rtype: dict

        Pseudocode:
        -----------

            1. parse file_id into `system`, `file_user` and `file_path`
            2. construct trash file path e.g. ('agave.system.id/user_home/.Trash')
            3. check on the ES cache if the trash folder exists.
                If the trash folder doesn't exists create it
            4. IF there is a file in the trash folder with the same name as
                the file we want to move (checking the ES cache for this)

                4.1 IF the file we want to move is a folder

                    4.1.2 change target name to <folder_name>_<datetime>

                4.2 ELSE the file is not a folder

                    4.2.1 change target name to <file_naem>_<datetime>.<ext>

            5. ELSE use original file name as the target name
            6. move file calling `self.move`

        """
        system, file_user, file_path = self.parse_file_id(file_id)

        # Ensure $HOME/.Trash exists
        trash_id = os.path.join(system, self.username, '.Trash')
        trash_path = os.path.join(self.username, '.Trash')
        trash = Object.from_file_path(system, self.username, trash_path)
        if trash is None:
            user_home_id = os.path.join(system, self.username)
            self.mkdir(user_home_id, '.Trash', **kwargs)

        path_comps = os.path.split(file_path)
        check_trash = Object.from_file_path(system, self.username,
                                            os.path.join(trash_path, path_comps[1]))

        if check_trash is not None:
            # file with same name already exists in Trash. rename this file first.
            timestamp = datetime.datetime.now().isoformat().replace(':', '-')
            this_file = Object.from_file_path(system, self.username, file_path)

            if this_file.type == 'dir':
                trash_name = '%s_%s' % (this_file.name, timestamp)
            else:
                trash_name = '%s_%s%s' % (this_file.name.replace(this_file.ext, ''),
                                          timestamp,
                                          this_file.ext)

            logger.debug('File %s exists in trash; renaming to %s then moving',
                         this_file.name, trash_name)

            renamed_file = self.rename(file_id, trash_name)
            file_id = renamed_file['id']

        return self.move(file_id, self.resource, trash_id)

    def mkdir(self, file_id, dir_name, **kwargs):
        """Create a directory

        Creates a directory both in the Agave filesystem and the
        Elasticsearch index.

        :param str file_id: the file_id of the path where the directory should be created
        :param str dir_name: the name of the directory to create

        :returns: dict representation of the
            :class:`designsafe.apps.api.data.agave.file.AgaveFile` instance
        :rtype: dict

        Examples:
        --------
            Creating a directory `mkdir_test` in the $HOME directory
            of the user `username`
            >>> fm.mkdir(file_id = 'designsafe.storage.default/username',
            >>>          dir_name = 'mkdir_test')
        """

        system, file_user, file_path = self.parse_file_id(file_id)
        f = AgaveFile.mkdir(system, file_user, file_path, dir_name,
                            agave_client = self.agave_client)
        logger.debug('f: {}'.format(f.to_dict()))
        esf = Object.from_agave_file(file_user, f, get_pems = True)
        return f.to_dict()

    def preview(self, file_id, **kwargs):
        system, file_user, file_path = self.parse_file_id(file_id)

        f = AgaveFile.from_file_path(system, self.username, file_path,
                    agave_client = self.agave_client)

        if f.previewable:
            fmt = kwargs.get('format', 'json')
            if fmt == 'html':
                context = {}
                ext = f.ext.lower()
                if ext in AgaveFile.SUPPORTED_IMAGE_PREVIEW_EXTS:
                    postit = f.create_postit(force=False, lifetime=360)
                    context['image_preview'] = postit['_links']['self']['href']
                elif ext in AgaveFile.SUPPORTED_TEXT_PREVIEW_EXTS:
                    content = f.download()
                    try:
                        encoded = content.encode('utf-8')
                    except UnicodeError:
                        try:
                            encoding = chardet.detect(content)['encoding']
                            encoded = content.decode(encoding).encode('utf-8')
                        except UnicodeError:
                            logger.exception('Failed to preview file',
                                             extra={'file_id': file_id})
                            encoded = u'Sorry! We were unable to preview this file due ' \
                                      u'to a unrecognized content encoding. Please ' \
                                      u'download the file to view its contents.'
                    context['text_preview'] = encoded
                elif ext in AgaveFile.SUPPORTED_OBJECT_PREVIEW_EXTS:
                    postit = f.create_postit(force=False)
                    context['object_preview'] = postit['_links']['self']['href']
                return 'designsafe/apps/api/data/agave/preview.html', context
            else:
                preview_url = reverse('designsafe_api:file',
                                      args=[self.resource, file_id]
                                      ) + '?action=preview&format=html'
                return {'href': preview_url}
        else:
            return None

    def rename(self, file_id, target_name, **kwargs):
        """Renames a file

        Renames a file both in the Agave filesystem and the
        Elasticsearch index.

        :param str file_id: string representing the file id
        :param str target_name: name used to rename the file

        :returns: dict representation of the
            :class:`designsafe.apps.api.data.agve.file.AgaveFile` instance
        :rtype: dict

        Notes:
        ------
            `path` should only be the name the file will be renamed with.
        """
        system, file_user, file_path = self.parse_file_id(file_id)

        try:
            f = AgaveFile.from_file_path(system, file_user, file_path,
                                         agave_client=self.agave_client)
            f.rename(target_name)
            esf = Object.from_file_path(system, self.username, file_path)
            esf.rename(self.username, target_name)
            return f.to_dict()
        except HTTPError as e:
            logger.error('HTTP {}: {}: {}'.format(
                e.response.status_code, e.response.reason, e.response.content))
            try:
                err_json = e.response.json()
                message = err_json['message']
            except ValueError:
                message = e.response.content

            raise ApiException(message, e.response.status_code, response=e.response,
                               extra={'operation': 'rename',
                                      'file_id': file_id,
                                      'target_name': target_name})

    def search(self, **kwargs):
        """Searches a file using the Elasticsearch index

        :param str q: query string to search
        :param str q_{field_name}: query string to search in a specific field

        """
        res, s = Object.search_query(self.username, **kwargs)
        search_data = {
            'source': self.resource,
            'system': settings.AGAVE_STORAGE_SYSTEM,
            'id': '$search',
            'type': 'folder',
            'name': '$SEARCH',
            'path': '',
            'ext': '',
            'size': None,
            'lastModified': None,
            'query': {'q': kwargs.get('q'), 'fields': kwargs.get('fields', [])},
            'children': [o.to_file_dict() for o in s.scan() if not o.path.startswith('%s/.Trash' % self.username)],
            '_trail': [],
            '_pems': [{'username': self.username, 'permission': {'read': True}}],
        }
        return search_data

    def share(self, file_id, permissions, recursive = True, **kwargs):
        """Update permissions for a file

        The default functionality is to set READ permission on the file
        for the specified user

        :param str file_id: string with the format
            <filesystem id>[/ | /<username> [/ | /<file_path>] ]
        :param list permissions: permission to set on the file.
            A list of dicts with two keys `user_to_share` and `permission`
            [READ | WRITE | EXECUTE | READ_WRITE |
                READ_EXECUTE | WRITE_EXECUTE | ALL | NONE]

        .. note::
            If the target file is a directory then it will set the permissions
            recursively
        """
        system, file_user, file_path = self.parse_file_id(file_id)

        f = AgaveFile.from_file_path(system, self.username, file_path,
                                     agave_client=self.agave_client)
        #f.share(permissions)
        ##reindex_agave.apply_async(args=(self.username, file_id))
        ## self.indexer.index(system, file_path, file_user, pems_indexing=True)
        #
        #esf = Object.from_file_path(system, self.username, file_path)
        #esf.share(self.username, permissions)
        share_agave.apply_async(args=(self.username, file_id, permissions,
                                      recursive),
                                      queue='indexing')
        return f.to_dict()

    def transfer(self, file_id, dest_resource, dest_file_id):
        from designsafe.apps.api.data import lookup_transfer_service
        service = lookup_transfer_service(self.resource, dest_resource)
        if service:
            service.apply_async(args=(self.username,
                                      self.resource,
                                      file_id,
                                      dest_resource,
                                      dest_file_id),
                                      queue='indexing')
            return {'message': 'The requested transfer has been scheduled'}
        else:
            message = 'The requested transfer from %s to %s ' \
                      'is not supported' % (self.resource, dest_resource)
            extra = {'file_id': file_id,
                     'dest_resource': dest_resource,
                     'dest_file_id': dest_file_id}
            raise ApiException(message, status=400, extra=extra)

    def update_metadata(self, file_id, meta_obj, **kwargs):
        system, file_user, file_path = self.parse_file_id(file_id)
        esf = Object.from_file_path(system, self.username, file_path)
        esf.update_metadata(meta_obj)
        return esf.to_file_dict()

    def upload(self, file_id, files, **kwargs):
        upload_file = files['file']
        index_parent = False
        rel_path = kwargs.pop('relative_path', None)
        if rel_path:
            # ensure path exists
            rel_path_id = file_id
            for c in rel_path.split('/')[:-1]:
                rel_path_id = os.path.join(rel_path_id, c)
                rel_path_real_path = self.get_file_real_path(rel_path_id)
                if not os.path.isdir(rel_path_real_path):
                    try:
                        index_parent = True
                        os.mkdir(rel_path_real_path, 0o0755)
                    except OSError as e:
                        if e.errno == 17:
                            pass
                        else:
                            logger.exception(
                                'Error creating directory: {}'.format(rel_path_real_path))
                            raise
            upload_file_id = os.path.join(rel_path_id, upload_file.name)
        else:
            upload_file_id = os.path.join(file_id, upload_file.name)

        logger.debug(upload_file_id)
        upload_real_path = self.get_file_real_path(upload_file_id)
        with open(upload_real_path, 'wb+') as destination:
            for chunk in upload_file.chunks():
                destination.write(chunk)

        metrics.info('User uploaded files via Data Browser', extra={
            'user': self.username,
            'operation': 'databrowser.upload',
            'info': {
                'file_name': upload_file.name,
                'file_size': upload_file.size,
                'content_type': upload_file.content_type,
                'destination': upload_real_path
            },
        })

        u_system, u_file_user, u_file_path = self.parse_file_id(upload_file_id)
        u_file = AgaveFile.from_file_path(u_system, u_file_user, u_file_path,
                                          agave_client=self.agave_client)
        doc = Object.from_agave_file(u_file_user, u_file, get_pems=True)
        doc.save()
        if index_parent:
            reindex_agave.apply_async(kwargs={'username': self.username,
                                              'file_id': file_id,
                                              'full_indexing': False,
                                              'pems_indexing': True,
                                              'index_full_path': True},
                                      queue='indexing')
        return u_file.to_dict()

    def from_file_real_path(self, file_real_path):
        if file_real_path.startswith(self.mount_path):
            return file_real_path.replace(self.mount_path, settings.AGAVE_STORAGE_SYSTEM)
        else:
            raise ApiException('The path "%s" is not on the default storage system. '
                               'Unable to map to file_id.' % file_real_path)

    def get_file_real_path(self, file_id):
        system, file_user, file_path = self.parse_file_id(file_id)
        return os.path.join(self.mount_path, file_path)


class AgaveIndexer(AgaveObject):
    """Indexer class for all indexing needs.

    This class helps when indexing files/folders into elasticsearch.
    A file/folder needs to be indexed after any change except for content changes.
    Meaning, when a file/folder is created, renamed, moved, etc.

    It is recommended to call any of this class' methods in a celery task.
    This is because most of the indexing operations take a
    considerable amount of time.

    This class retrieves the agave client using ``ds_admin`` credentials in order to
    try and normalize the permission's object returned by Agave.

    **Disclaimer**: A class is used to pack all this functionality together.
    This is not necessary and these methods should, probably, live in a separate
    module. The decision to leave this class here, for now, is because of the close
    relation the indexing operations have with the :class:`filemanager` operations.

    **Generators**:

        There are two generators implemented in this class
        :meth:`walk` and :meth:`walk_levels`. The functionality of these generators
        is based on :meth:`os.walk` and their intended use is the same.

        :meth:`walk_levels` is similar to :meth:`os.walk`. This is the prefered
        method to walk an Agave filesystem.

        :meth:`walk` differs from the regular :meth:`os.walk` in that it returns
        a single file on every iteration instead of lists of `files` and `folders`.
        This implementation is mainly legacy and was the first approach to walking
        an agave filesyste that we tried. It is recommended to use
        :meth:`walk_levels` since it is more efficient. :met:`walk` can
        still be used, preferably, if the folder to walk is small.

    **Indexing**:

        There are three different methods for indexing :meth:`index`, :meth:`index_full`
        and :met:`index_permissions`. The speration is necessary due to the number of
        calls necessary to get all the information needed. If we want to retrieve
        all the information for a specific file from agave (file information and
        permissions) we need to to a `files.listing` call and a `files.pems` call.

        Retrieving the permissions is a separate call because Agave calculates
        the permissions of a file based on different rules stored in the database.
        This need for two calls drives us to use **"optimistic permissions"** when ever
        possible. **"optimistic permissions"** is when we assume who the owner of the
        file is going to be and create a permission object with the owner's username
        instead of making another call to Agave. The owner's username is extracted
        from the target file path. We assume a file path of $HOME/path/to/file.txt
        where $HOME will always be the username of the owner.

    .. note:: It is recommended to not instantiate this class directly.
        The :class:`FileManager` class will count with an instance
        of this class:
        >>> mgr = FileManager(user_obj)
        >>> #do indexing stuff
        >>> mgr.indexer.index(...)

    """
    def __init__(self, agave_client = None, *args, **kwargs):
        super(AgaveIndexer, self).__init__(**kwargs)
        self.agave_client = Agave(api_server=settings.AGAVE_TENANT_BASEURL,
                                  token=settings.AGAVE_SUPER_TOKEN)

        # user_model = get_user_model()
        # try:
        #     ds_admin = user_model.objects.get(username='ds_admin')
        #     self.agave_client = ds_admin.agave_oauth.client
        # except ObjectDoesNotExist as e:
        #     self.agave_client = agave_client

    def walk(self, system_id, path, bottom_up = False, yield_base = True):
        """Walk a path in an agave filesystem.

        This generator will yield single :class:`~designsafe.apps.api.agave.file.AgaveFile`
        object at a time. A call to `files.list` is done for every sub-level of `path`.
        For a more efficient approach see :meth:`walk_levels`.

        :param str system_id: system id
        :param str path: path to walk
        :param bool bottom_up: if `True` walk the path bottom to top.
            Default `False` will walk the path top to bottom
        :param bool yield_base: if 'True' will yield an
            :class:`~designsafe.apps.api.agave.file.AgaveFile` object of the
            path walked in the first iteration. After the first iteration it
            will yield the children objects. Default 'True'.

        :returns: childrens of the given file path
        :rtype: :class:`~designsafe.apps.api.data.agave.file.AgaveFile`

        **Pseudocode**

        1. call `files.list` on `path`
        2. for each file in the listing

            2.1. instantiate :class:`~designsafe.apps.api.agave.file.AgaveFile`
            2.2. check if we need to yield the parent folder
            2.3. yield the :class:`~designsafe.apps.api.agave.file.AgaveFile`
                instance if walking top to bottom
            2.4. if it is a folder

                2.4.1. call :met:`walk` with the folder's path
                2.4.1. yield the object

            2.3. yield the :class:`~designsafe.apps.api.agave.file.AgaveFile`
                instance if walking bottom to top

        """
        files = self.call_operation('files.list', systemId = system_id,
                                    filePath = path)
        for f in files:
            #logger.debug('path: {}'.format(f['path']))
            aff = AgaveFile(agave_client = self.agave_client, wrap = f)
            if f['name'] == '.' or f['name'] == '..':
                if not yield_base:
                    continue
            if not bottom_up:
                yield aff
            if f['format'] == 'folder' and f['name'] != '.':
                for sf in self.walk(system_id, aff.full_path, bottom_up = bottom_up, yield_base = False):
                    yield sf
            if bottom_up:
                yield aff

    def walk_levels(self, system_id, path, bottom_up = False):
        """Walk a path in an agave filesystem.

        This generator walks the agavefilesystem making a call to `files.list`
        for each sub-level of the given path. This generator differs from
        :meth:`walk` in that it returns all files and folders in a level
        instead of a single file at a time. This behaviour is closer to
        that of :meth:`os.walk`

        :param str system_id: system id
        :param str path: path to walk
        :param bool bottom_up: if `True` walk the path bottom to top. Default `False`
            will walk the path top to bottom

        :returns: A triple with the root fiele path string, a list with all the
            folders in the current level and a list with all the files in the
            current level.
        :rtype: (`str` root,
            [:class:`~designsafe.apps.api.agave.file.AgaveFile`] folders,
            [:class:`~designsafe.apps.api.agave.file.AgaveFile`] files)


        Pseudocode:
        -----------

        1. call `files.list` on `path`
        2. for each file in the listing

            2.1. instantiate :class:`~designsafe.apps.api.agave.file.AgaveFile`
            2.2. append object to the corresponding folders or files list

        3. if is a top to bottom walk then yield (path, folders, files)
        4. for every folder in `folders`

            4.1. yield returned triple from calling :meth:`walk_levels`
                using the folder's path

        5. if is a bottom to top walk then yield (path, folders, files)

        Notes:
        ------

            Similar to :meth:`os.walk` the `files` and `folders` list can be
            modified inplace to modify future iterations. Modifying the
            `files` and `folders` lists inplace can be used to tell the
            generator of any modifications done with every iteration.
            This only makes sense when `bottom_up` is `False`. Any inplace
            change to the `files` or `folders` list when `bottom_up` is
            `True` it will not affect the behaviour of the yielded objects.

        Examples:
        ---------

            Only walk a specific number of levels

            >>> levels = 2
            >>> for root, folders, files in self.walk_levels('designsafe.storage.default',
            ... 'username'):
            >>>     #do cool things
            >>>     #first check if we are at the necessary level
            >>>     if levels and len(root.split('/')) >= levels:
            ...         #delete everything from the folders list
            ...         #so the generator will stop recursing
            ...         del folders[:]

        """

        resp = self.call_operation('files.list', systemId=system_id, filePath=urllib2.quote(path))
        folders = []
        files = []
        for f in resp:
            if f['name'] == '.':
                continue
            aff = AgaveFile(self.agave_client, wrap = f)
            if aff.format == 'folder':
                folders.append(aff)
            else:
                files.append(aff)
        if not bottom_up:
            yield (path, folders, files)
        for aff in folders:
            for (spath, sfolders, sfiles) in self.walk_levels(system_id, aff.full_path, bottom_up = bottom_up):
                yield (spath, sfolders, sfiles)

        if bottom_up:
            yield (path, folders, files)

    def _dedup_and_discover(self, system_id, username, root, files, folders):
        """Deduping and discovery of Agave Files in Elasticsearch (ES)

        This helper function process a list of folders and files to discover
        new file objects that haven't been indexed in ES. Also, dedups
        objects saved to the ES index.

        :pram str system_id: system id
        :param str username: the owner's username of the path being indexed
        :param str root: root path
        :param list files: a list of :class:`~designsafe.apps.api.data.agave.file.AgaveFile` objects
        :param list folders: a list of :class:`~designsafe.apps.api.data.agave.file.AgaveFile` objects

        :returns: `(objs_to_index, docs_to_delete)` A tuple with two lists
            `objs_to_index` is a list of :class:`~designsafe.apps.api.data.agave.file.AgaveFile`
            objects for which no ES object was found with the same `path` + `name`.
            `docs_to_delete` is a list of
            :class:`~designsafe.apps.api.agave.elasticsearch.document.Object` objects
            which appear repeated in the ES index.
        :rtype: tuple of lists

        Pseudocode
        ----------

            1. construct a list of all the file names. This is so we can use it
                to compare the documents retrieved from ES. We use only the
                file name because we are operating on a specific filesystem level
                meaning that the path is always going to be the same.
            2. get all the documents that are direct children of the root path given.
            3. for each document retrieved from ES

                3.1. append document to the list of documents
                3.2. if the name of the document is already in the list of
                    document names then we assume is a duplicate and append it
                    to the list of documents to delete.
                    If the name of the document is not in the list of document
                    names then append it

            4. create the `objs_to_index` list by getting all the file objects
                which names do not appear in the list of document names. Meaning,
                we are getting all the file objects that we do not have in the
                ES index.
            5. create the `docs_to_delete` list by appending all the documents
                which names do not appear in the file object names list to the
                previously creatd duplicated documents list. Meaning, we are
                appending all the ES documents for which there are no file in the
                agave filesystem.
        """

        objs = folders + files
        objs_names = [o.name for o in objs]
        r, s = Object.listing(system_id, username, root)
        docs = []
        doc_names = []
        docs_to_delete = []

        for d in s.scan():
            docs.append(d)
            if d.name in doc_names:
                docs_to_delete.append(d)
            else:
                doc_names.append(d.name)

        objs_to_index = [o for o in objs if o.name not in doc_names]
        docs_to_delete += [o for o in docs if o.name not in objs_names]
        return objs_to_index, docs_to_delete

    def index(self, system_id, path, username, bottom_up = False,
              levels = 0, index_full_path = True, full_indexing = False,
              pems_indexing = False):
        """Indexes a file path

        This method walks an agave file path and indexes the file's information
        into Elasticsearch (ES).

        :param str system_id: system id
        :param str path: path to index
        :param str username: username making the request, this will be
            used for "optimistic permissions"
        :param bool bottom_up: if `True` then the path walk will occur from the
            bottom to the top. Default `False`
        :param int levels: number of levels deep to index. Default `0` which means
            to index all the levels.
        :param bool index_full_path: if `True` each of the parent folders will get
            indexed. Default `True`
        :param bool full_indexing: if `True` it will update all the corresponding
            ES documents based on the existing files. **Warning** if this is set
            no deduping or discovery is performed. Default `False`
        :param bool pems_indexing: if `True` "optimistic permissions" will not be
            used and the response to `files.listPermissions` will get indexed.

        :returns: a tuple with the count of documents created and documents deleted
        :rtype: list

        Pseudocode
        ----------

            1. use `walk_levels` to get the lists of files and folders
            2. call `_dedup_and_discover` to get file objects to index
                and ES documents to delete

            3 for each document to delete

                3.1 delete ES document recursevly.

            4. if `full_indexing` is **not** `True`

                4.1 for each object to index

                    4.1.1 create ES document

            5. if `full_indexing` is `True`

                5.1 for every file and folder in this level

                    5.1.1 get or create ES document and update its data

            6. if `index_full_path` is `True`

                6.1 split indexing path by `/` store it in `path_comp`
                6.2 for every string in `path_comp`

                    6.2.1 get agave file object
                    6.2.2 get or create ES document

        Notes
        -----

            The documents indexed count returned does not represent the new documents
            created. It represent all the documents that were created and/or updated.
            Meaning, all the documents touched.
        """
        docs_indexed = 0
        docs_deleted = 0
        for root, folders, files in self.walk_levels(system_id, path,
                                                     bottom_up=bottom_up):

            objs_to_index, docs_to_delete = self._dedup_and_discover(system_id,
                                                username, root, files, folders)
            for d in docs_to_delete:
                logger.debug(u'delete_recursive: {}'.format(d.full_path))
                docs_deleted += d.delete_recursive(username)

            if not full_indexing:
                for o in objs_to_index:
                    logger.debug(u'Indexing: {}'.format(o.full_path))
                    doc = Object.from_agave_file(username, o, get_pems = pems_indexing)
                    docs_indexed += 1
            else:
                folders_and_files = folders + files
                for o in folders_and_files:
                    logger.debug(u'Get or create file: {}'.format(o.full_path))
                    doc = Object.from_agave_file(username, o,
                                    auto_update = True, get_pems = pems_indexing)
                    docs_indexed += 1

            if levels and (len(root.split('/')) - len(path.split('/')) + 1) >= levels:
                del folders[:]

        if index_full_path:
            path_comp = path.split('/')[:-1]
            for i in range(len(path_comp)):
                file_path = '/'.join(path_comp)
                path, name = os.path.split(path)
                af = AgaveFile.from_file_path(system_id, username, file_path,
                                        agave_client = self.agave_client)
                logger.debug(u'Get or create file: {}'.format(af.full_path))
                doc = Object.from_agave_file(username, af,
                                    auto_update = full_indexing, get_pems = pems_indexing)
                docs_indexed += 1
                path_comp.pop()
        return docs_indexed, docs_deleted

    def index_permissions(self, system_id, path, username, bottom_up = True, levels = 0):
        """Indexes the permissions

        This method works from the indexed documents. It searches for all the
        Elasticsearch (ES) documents that are children of the given `path` and updates
        the permissions doing a `files.listPermissions` call to agave. This means that
        this method does not creates ES documents or do any deduping.

        :param str system_id: system id
        :param str path: path to walk
        :param str username: username who is making the request
        :param bool bottom_up: if `True` iterate through the ES documents from the bottom
            to the top based on path length
        :param int levels: number of levels to iterate through. If `bottom_up` is set
            to `True` this does not do anything.

        :returns: count of documents updated
        :rtype: int

        Notes
        -----

            In order to get all the documents that are children of the given path
            we use a search that searches on `path._path` property of the document
            this is set with a hierarchy tokenizer.

            This means that with one search we can get all the children documents
            of a given path in one call, but they are not necessarily going
            to be sorted. In order to sort the files we sort them by the length
            of their paths. This is not necessarily correct but it is good enough
            for updating permissions.
        """
        import urllib
        cnt = 0
        r, s = Object.listing_recursive(system_id, username, path)
        objs = sorted(s.scan(), key = lambda x: len(x.path.split('/')), reverse=bottom_up)
        if levels:
            objs = filter(lambda x: len(x.path.split('/')) <= levels, objs)
        p, n = os.path.split(path)
        if p == '':
            p = '/'
        objs.append(Object.from_file_path(system_id, username, os.path.join(p, n)))
        for o in objs:
            if len(o.path.split('/')) == 1 and o.name == 'Shared with me':
                continue
            pems = self.call_operation('files.listPermissions', filePath = urllib.quote(os.path.join(o.path, o.name)), systemId = system_id)
            o.update(permissions = pems)
            cnt += 1

        return cnt

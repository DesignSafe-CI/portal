from agavepy.agave import AgaveException, Agave
from agavepy.async import AgaveAsyncResponse, TimeoutError, Error
from designsafe.apps.api.exceptions import ApiException
from designsafe.apps.api.data.agave.agave_object import AgaveObject
from designsafe.apps.api.data.agave.file import AgaveFile
from designsafe.apps.api.data.agave.elasticsearch.documents import Object, PublicObject
from django.conf import settings
from django.core.urlresolvers import reverse
import urllib
import os
import logging

logger = logging.getLogger(__name__)


class FileManager(AgaveObject):

    resource = 'public'
    system_id = 'nees.public'
    mount_path = '/corral-repl/tacc/NHERI/public/projects'

    def __init__(self, user_obj, **kwargs):
        super(FileManager, self).__init__(**kwargs)
        agave_url = getattr(settings, 'AGAVE_TENANT_BASEURL')
        if user_obj.is_authenticated():
            self.agave_client = user_obj.agave_oauth.client
        else:
            site_token = getattr(settings, 'AGAVE_SUPER_TOKEN')
            self.agave_client = Agave(api_server=agave_url,
                                      token=site_token)
        self.username = user_obj.username
        self._user = user_obj

    def parse_file_id(self, file_id):
        """Parses a `file_id`.

        :param str file_id: String with the format
        <filesystem id>[/ | /<username> [/ | /<file_path>] ]

        :returns: a list with up to two elements

            * index 0 `system_id`: String. Filesystem id
            * index 1 `file_path`: String. Complete file path.
        :rtype: list

        :raises ValueError: if the object is not in the desired format

        Examples:
        --------
            `file_id` can look like this:
              `nees.public`:
              Points to the root folder in the
              `nees.public` filesystem.

              `nees.public/NEES-1234-5678.groups`:
              Points to the NEES-1234-5678 project directory.

              `nees.public/NEES-1234-5678.groups/folder`:
              Points to the folder `folder` in the NEES-1234-5678 project directory.

              `nees.public/NEES-1234-5678.groups/folder/file.txt`:
              Points to the file `file.txt` in the folder `folder` in the NEES-1234-5678
              project directory.
        """
        if file_id is None or file_id == '':
            system_id = self.system_id
            file_path = ''
        else:
            components = file_id.strip('/').split('/')
            system_id = components[0] if len(components) >= 1 else self.system_id
            file_path = '/'.join(components[1:]) if len(components) >= 2 else ''

        return system_id, file_path

    def get_file_real_path(self, file_id):
        system, file_path = self.parse_file_id(file_id)
        return os.path.join(self.mount_path, file_path)

    def _es_listing(self, system, username, file_path, **kwargs):
        """Returns a "listing" dict constructed with the response from Elasticsearch.

        :param str system: system id
        :param str username: username which is requesting the listing. 
                             This is to check the permissions in the ES docs.
        :param str file_path: path to list

        :returns: A dict with information of the listed file and, when possible, 
        a list of :class:`~designsafe.apps.api.data.agave.elasticsearch.documents.Object` objects
        dict in the key ``children``
        :rtype: dict

        Notes:
        -----

            This should not be called directly. See py:meth:`listing(file_id)`
            for more information.
        """
        file_path = file_path or '/'
        res, listing  = PublicObject.listing(system, file_path, **kwargs)

        default_pems = [{'username': self.username,
                         'permission': {'read': True, 
                                        'write': False, 
                                        'execute': True},
                         'recursive': True}]

        if file_path == '/':
            list_data = {
                'source': self.resource,
                'system': 'nees.public',
                'id': 'nees.public/',
                'type': 'folder',
                'name': '',
                'path': '/',
                'ext': '',
                'size': None,
                'lastModified': None,
                'children': [o.to_dict(def_pems = default_pems, with_meta = True) for o in listing],
                '_trail': [],
                '_pems': default_pems
            }
        else:
            root_listing = PublicObject.from_file_path(system, file_path)
            if root_listing:
                list_data = root_listing.to_dict(def_pems = default_pems)
                list_data['children'] = [o.to_dict(def_pems = default_pems) for o in listing]
            else:
                list_data = None

        return list_data

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
        listing = AgaveFile.listing(system, file_path, self.agave_client, 
                                    source='public', **kwargs)

        root_file = filter(lambda x: x.full_path == file_path, listing)

        default_pems = [{'username': self.username,
                         'permission': {'read': True, 'write': False, 'execute': True},
                         'recursive': True}]

        list_data = root_file[0].to_dict(default_pems=default_pems)
        list_data['children'] = [o.to_dict(default_pems=default_pems)
                                 for o in listing if o.full_path != file_path]

        return list_data

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

    def listing(self, file_id=None, **kwargs):
        """
        Lists contents of a folder or details of a file.

        :param str file_id: id representing the file. Format:
        <filesystem id>[/ | /<username> [/ | /<file_path>] ]

        :returns:listing dict. A dict with the properties of the
        parent path file object plus a `children` key with a list
        of :class:`~`.
        If the `file_id` passed is a file and not a folder the
        `children` list will be empty.
        :rtype: dict

        Examples:
            A listing dictionary:

            .. code-block:: json

                {
                  _pems: [ ],
                  type: "folder",
                  path: "",
                  id: "nees.public/path/folder",
                  size: 32768,
                  name: "experiments",
                  lastModified: "2016-04-26T22:25:30-0500",
                  system: "nees.public",
                  children: [],
                  source: "agave",
                  ext: "",
                  _actions: [ ],
                  _trail: [ ]
                }

            To loop through the listing's files:

            .. code-block:: python

                listing = fm.listing(**kwargs)
                for child in listing['children']:
                    do_something_cool(child)

        """
        system, file_path = self.parse_file_id(file_id)
        listing = None
        try:
            listing = self._es_listing(system, self.username, file_path, **kwargs)
        except Exception as e:
            logger.debug('Error listing using Es. Falling back to Aagave', exc_info=True)
        fallback = listing is None or(
            listing['type'] == 'folder' and
            len(listing['children']) == 0)

        if fallback:
            es_listing = listing.copy() if listing is not None else None
            try:
                listing = self._agave_listing(system, file_path, **kwargs)
                if not listing['children']:
                    listing = es_listing
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
        :class:`designsafe.apps.api.data.agve.file.AgaveFile` instance
        :rtype: dict

        Examples:
        --------
            Copy a file. `fm` is an instance of FileManager
            >>> fm.copy(file_id='designsafe.storage.default/username/file.jpg',
            >>>         dest_resource='agave',
            >>>         dest_file_id='designsafe.storage.default/username/file_copy.jpg')
        """
        if self._user.is_anonymous():
            raise ApiException(message='You must log in to perform this action.',
                               status=403)

        # can only transfer out of public
        from designsafe.apps.api.data import lookup_transfer_service
        service = lookup_transfer_service(self.resource, dest_resource)
        if service:
            args = (self.username, self.resource, file_id, dest_resource, dest_file_id)
            service.apply_async(args=args, queue='files')
            return {'message': 'The requested transfer has been scheduled'}
        else:
            message = 'The requested transfer from %s to %s ' \
                      'is not supported' % (self.resource, dest_resource)
            extra = {'file_id': file_id,
                     'dest_resource': dest_resource,
                     'dest_file_id': dest_file_id}
            raise ApiException(message, status=400, extra=extra)

    def download(self, file_id, **kwargs):
        """Get the download link for a file

        :param str file_id: String with the format
        <filesystem id>[/ | /<username> [/ | /<file_path>] ]

        :returns: a dict with a single key `href` which has the direct
            noauth link to download a file
        :rtype: dict

        """
        system, file_path = self.parse_file_id(file_id)

        f = AgaveFile.from_file_path(system, None, file_path,
                                     agave_client=self.agave_client, source='public')
        if f.type == 'file':
            postit = f.create_postit(force=True, max_uses=10, lifetime=3600)
            return {'href': postit['_links']['self']['href']}
        else:
            return None

    def preview(self, file_id, **kwargs):
        system, file_path = self.parse_file_id(file_id)

        f = AgaveFile.from_file_path(system, None, file_path,
                                     agave_client=self.agave_client, source='public')

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
                    context['text_preview'] = content
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

    def search(self, **kwargs):
        res, s = PublicObject.search_query_with_projects(self.system_id, self.username, **kwargs)
        search_data = {
            'source': self.resource,
            'system': 'nees.public',
            'id': '$search',
            'type': 'folder',
            'name': '$SEARCH',
            'path': '',
            'ext': '',
            'size': None,
            'lastModified': None,
            'query': {'q': kwargs.get('q'), 'fields': kwargs.get('fields', [])},
            'children': [o.to_dict() for o in s if not o.path.startswith('%s/.Trash' % self.username)],
            '_trail': [],
            '_pems': [{'username': self.username, 'permission': {'read': True}}],
        }
        return search_data

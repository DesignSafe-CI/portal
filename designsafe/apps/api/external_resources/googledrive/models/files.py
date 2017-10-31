import logging
import os

logger = logging.getLogger(__name__)


class GoogleDriveFile(object):
    """Represents a google drive file"""

    SUPPORTED_IMAGE_PREVIEW_EXTS = [
      '.ai', '.bmp', '.gif', '.eps', '.jpeg', '.jpg', '.png', '.ps', '.psd', '.svg', '.tif', '.tiff',
      '.dcm', '.dicm', '.dicom', '.svs', '.tga',
    ]

    SUPPORTED_TEXT_PREVIEWS = [
      '.as', '.as3', '.asm', '.bat', '.c', '.cc', '.cmake', '.cpp', '.cs', '.css', '.csv', '.cxx',
      '.diff', '.doc', '.docx', '.erb', '.gdoc', '.groovy', '.gsheet', '.h', '.haml', '.hh', '.htm',
      '.html', '.java', '.js', '.less', '.m', '.make', '.ml', '.mm', '.msg', '.ods', '.odt', '.odp',
      '.php', '.pl', '.ppt', '.pptx', '.properties', '.py', '.rb', '.rtf', '.sass', '.scala',
      '.scm', '.script', '.sh', '.sml', '.sql', '.txt', '.vi', '.vim', '.wpd', '.xls', '.xlsm',
      '.xlsx', '.xml', '.xsd', '.xsl', '.yaml',
    ]

    SUPPORTED_OBJECT_PREVIEW_EXTS = [
      '.pdf',
      '.aac', '.aifc', '.aiff', '.amr', '.au', '.flac', '.m4a', '.mp3', '.ogg', '.ra', '.wav', '.wma',

      # VIDEO
      '.3g2', '.3gp', '.avi', '.m2v', '.m2ts', '.m4v', '.mkv', '.mov', '.mp4', '.mpeg', '.mpg',
      '.ogg', '.mts', '.qt', '.wmv',
    ]

    SUPPORTED_PREVIEW_EXTENSIONS = (SUPPORTED_IMAGE_PREVIEW_EXTS +
                                    SUPPORTED_TEXT_PREVIEWS +
                                    SUPPORTED_OBJECT_PREVIEW_EXTS)

    def __init__(self, googledrive_item, parent=None, drive=None):
        self._item = googledrive_item
        self._driveapi = drive
        if parent:
            self._parent = GoogleDriveFile(parent, drive=drive)
        else:
            self._parent = None

    @property
    def id(self):
        return '{}/{}'.format(self.type, self._item['id'])

    @property
    def name(self):
        return self._item['name']

    @property
    def path(self):
        if self._parent:
            if self._parent.name == 'My Drive':
                path = '/{}'.format(self.name)
            else:
                path = '/'.join([self._parent.path, self.name])
        elif 'parents' in self._item:
            parent = self._item
            path = '{}'.format(self.name)
            while True:
                try:
                    parent = self._driveapi.files().get(fileId=parent['parents'][0], fields="parents, name").execute()
                    parent_name = '' if parent['name'] == 'My Drive' else parent['name']
                    path = "{}/{}".format(parent_name, path)
                except (AttributeError, KeyError) as e:
                    logger.debug(e)
                    break
        else:
            path = ''
        return path

    @property
    def size(self):
        return self._item.get('size')

    @property
    def last_modified(self):
        return self._item.get('modifiedTime')

    @property
    def type(self):
        if self._item['mimeType'] == 'application/vnd.google-apps.folder':
            return 'folder'
        else:
            return 'file'

    @property
    def ext(self):
        try:
            return '.{}'.format(self._item['fileExtension'])
        except KeyError:
            return None

    @property
    def trail(self):
        path_comps = self.path.split('/')

        trail_comps = [{'name': path_comps[i] or '/',
                    'system': None,
                    'resource': 'googledrive',
                    'path': '/'.join(path_comps[0:i+1]) or '/',
                    } for i in range(0, len(path_comps))]

        return trail_comps

    @property
    def previewable(self):
        return self.type != 'folder' and self.ext in self.SUPPORTED_PREVIEW_EXTENSIONS

    @staticmethod
    def parse_file_id(file_id):
        """
        Parses out the file_id that the Data Browser uses. For Google Drive objects, this is in
        the format {type}/{id}, where {type} is in ['folder', 'file'] and {id} is the
        numeric id of the Google Drive object.

        Args:
            file_id: The file_id in the format {type}/{id}

        Returns:
            Tuple of ({type}, {id})

        Raises:
            AssertionError
        """
        parts = file_id.split('/')

        assert len(parts) == 2, 'The file path should be in the format {type}/{id}'
        assert parts[0] in ['folder', 'file'], '{type} must be one of ["folder", "file"]'

        return parts[0], parts[1]

    def to_dict(self, trail=True, **kwargs):
        pems = kwargs.get('default_pems', [])
        obj_dict = {
            'system': None,
            'id': self.id,
            'type': self.type,
            'path': self.path,
            'name': self.name,
            'ext': self.ext,
            'size': self.size,
            'lastModified': self.last_modified,
            '_actions': [],
            'permissions': pems,
            'resource': 'googledrive'
        }
        if trail:
            obj_dict['trail'] = self.trail

        return obj_dict

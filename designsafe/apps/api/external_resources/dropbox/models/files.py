from dropbox.files import ListFolderResult, FileMetadata, FolderMetadata
import logging
import os

logger = logging.getLogger(__name__)


class DropboxFile(object):
    """Represents a Dropbox file"""

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

    def __init__(self, dropbox_item, path=None, parent=None):
        self._item = dropbox_item
        self.path = path

        if parent:
            self._parent = DropboxFile(parent)
        else:
            self._parent = None

    @property
    def id(self):
        return '{}{}'.format(self.type, self.path)

    @property
    def name(self):
        try:
            return self._item.name
        except AttributeError:
            return self.trail[-1]['name']

    # @property
    # def path(self):
    #     return self._item.path_display

    @property
    def size(self):
        try:
            return self._item.size
        except AttributeError:
            return None

    @property
    def last_modified(self):
        try:
            return self._item.server_modified
        except AttributeError:
            return None

    @property
    def type(self):
        if type(self._item) in [FolderMetadata, ListFolderResult]:
            return 'folder'
        elif isinstance(self._item, FileMetadata):
            return 'file'

    @property
    def ext(self):
        return os.path.splitext(self.name)[1].lower()

    @property
    def trail(self):
        path_comps = self.path.split('/')

        # the first item in path_comps is '', which represents '/'
        trail_comps = [{'name': path_comps[i] or '/',
                        'system': None,
                        'resource': 'dropbox',
                        'path': '/'.join(path_comps[0:i + 1]) or '/',
                        } for i in range(0, len(path_comps))]

        # trail = [DropboxFile(File(None, e['id'], e)).to_dict()
        #         for e in self._item.path_collection['entries']]
        # trail.append(self.to_dict(trail=False))

        # return trail

        return trail_comps

    @property
    def previewable(self):
        return self.type != 'folder' and self.ext in self.SUPPORTED_PREVIEW_EXTENSIONS

    @staticmethod
    def parse_file_id(file_id):
        """
        Parses out the file_id that the Data Browser uses. For Box objects, this is in
        the format {type}/{path}, where {type} is in ['folder', 'file'] and {path} is the
        path of the Box object.

        Args:
            file_id: The file_id in the format {type}/{path}

        Returns:
            Tuple of ({type}, {path})

        Raises:
            AssertionError
        """
        parts = file_id.split('/', 1)

        assert len(parts) == 2, 'The file path should be in the format {type}/{path}'
        assert parts[0] in ['folder', 'file'], '{type} must be one of ["folder", "file"]'

        return parts[0], '/' + parts[1]

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
            'resource': 'dropbox'
        }
        if trail:
            obj_dict['trail'] = self.trail

        return obj_dict

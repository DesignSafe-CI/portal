from boxsdk.object.file import File
import logging
import os

logger = logging.getLogger(__name__)


class BoxFile(object):
    """Represents a box file"""

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

    SUPPORTED_PREVIEW_EXTENSIONS = (*SUPPORTED_IMAGE_PREVIEW_EXTS,
                                    *SUPPORTED_TEXT_PREVIEWS,
                                    *SUPPORTED_OBJECT_PREVIEW_EXTS)

    def __init__(self, box_item, parent=None):
        self._item = box_item
        if parent:
            self._parent = BoxFile(parent)
        else:
            self._parent = None

    @property
    def id(self):
        return '{}/{}'.format(self._item.type, self._item.id)

    @property
    def name(self):
        return self._item.name

    @property
    def path(self):
        try:
            path = '/'.join([e['name'] for e in self._item.path_collection['entries'][1:] if e['name']])
            path = '/'.join([path, self.name])
        except AttributeError:
            if self._parent:
                if self._parent.id == 'folder/0':  # Suppress 'All Files' name in path
                    path = '/{}'.format(self.name)
                else:
                    path = '/'.join([self._parent.path, self.name])
            else:
                path = ''
        return path

    @property
    def size(self):
        try:
            return self._item.size
        except AttributeError:
            return None

    @property
    def last_modified(self):
        try:
            return self._item.modified_at
        except AttributeError:
            return None

    @property
    def type(self):
        return self._item.type

    @property
    def ext(self):
        return os.path.splitext(self.name)[1].lower()

    @property
    def trail(self):
        try:
            trail = [BoxFile(File(None, e['id'], e)).to_dict()
                     for e in self._item.path_collection['entries']]
            trail.append(self.to_dict(trail=False))
            return trail
        except AttributeError:
            return []

    @property
    def previewable(self):
        return self.type != 'folder' and self.ext in self.SUPPORTED_PREVIEW_EXTENSIONS

    @staticmethod
    def parse_file_id(file_id):
        """
        Parses out the file_id that the Data Browser uses. For Box objects, this is in
        the format {type}/{id}, where {type} is in ['folder', 'file'] and {id} is the
        numeric id of the Box object.

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
        assert parts[1].isdigit(), '{id} should be digits only'

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
            'resource': 'box'
        }
        if trail:
            obj_dict['trail'] = self.trail

        return obj_dict

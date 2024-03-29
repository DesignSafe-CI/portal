from django.contrib.staticfiles.storage import StaticFilesStorage
from django.core.files.storage import FileSystemStorage

class CustomPipelineCachedStorage(StaticFilesStorage):
    def url(self, name, force=False):
        """
        Return the non-hashed URL when detecting cms paths in order to work
        with their webpack setup
        """

        if name.startswith('cms/'):
            return FileSystemStorage.url(self, name)
        return super(CustomPipelineCachedStorage, self).url(name)

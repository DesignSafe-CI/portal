from abc import ABCMeta, abstractmethod, abstractproperty

class AbstractFile:
    """
    Abstract Class to implement an Api file-like object.
    This class is mainly for a centrlize documentation
    on what a serializabe Api file-like object should
    look like.

    It is not terribly necessary to subclass from this class
    when creating a custom File class but noe should
    follow the structure here showed.
    """
    __metaclass__ = ABCMeta

    @abstractproperty
    def id(self):
        """
        Method to return file id

        Returns:
            A string representing a unique id of a file.
        """
        raise NotImplementedError()

    @abstractproperty
    def parent_path(self):
        """
        Method to return parent path

        Returns:
            A string representing the parent path of a file.

        """
        raise NotImplementedError()

    @abstractproperty
    def trail(self, **kwargs):
        """
        Returns trail list of this file object.
        A trail list is a list containing an dict object for each
        folder on this file's path. Each one of these dicts should
        have enough information to render the breadcrumb in the frontend
        and to be able to construct the API call to list each directory
        
        Example:
            If the file this class represents has a path `path/to/file.txt`
            and a parent path `path/to` then the returned list should 
            look like this:
            [
                {
                    "source": "agave",
                    "system": "designsafe.storage.default",
                    "id": "designsafe.storage.default/path",
                    "path": "/",
                    "name": "path"
                },
                {
                    "source": "agave",
                    "system": "designsafe.storage.default",
                    "id": "designsafe.storage.default/path/to",
                    "path": "path",
                    "name": "to"
                }
            ]
        
        Returns:
            A list with a dict for every object in the file trail path.
            Each dict in the returned list should contain enough information
            to construct a `listing` api call to list each folder.
        """
        raise NotImplementedError()

    @abstractmethod
    def to_dict(self, **kwargs):
        """
        Method to return a JSON serializable dict.

        Example:
            {
                'source': self.source,
                'system': None,
                'id': self.id,
                'type': self.type,
                'path': self.path,
                'name': self.name,
                'ext': self.ext,
                'size': self.size,
                'lastModified': self.last_modified,
                '_trail': self.trail,
                '_actions': [],
                '_pems': [],
            }

        Returns:
            A JSON serializable dict representation of this object.
        """
        raise NotImplementedError()

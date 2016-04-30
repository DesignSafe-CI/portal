from abc import ABCMeta, abstractmethod

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

    @abstractmethod
    def to_dict(self, **kwargs):
        """
        Method to return a serializable object.
        This is the basic structure of an Api file-like object.
        """
        return {
            'resource': self.resource,
            'actions': [],
            'pems': [],
            'name': self.name,
            'path': self.parent_path,
            'id': self.id,
            'size': self.length,
            'lastModified': self.lastModified,
        }

from abc import ABCMeta, abstractmethod


class AbstractFileManager:
    """
    Abstract Class to implement a data File Manager for different resources.
    A FileManager class should subclass this class.
    Notes: 
        - This is suported by python 2.6+ and in 3.2+ we can also 
          use @abstractclassmethod
        - Arguments are not enforced by abstract classes.
        - Subclasses of this class are called from the main class based data 
          views in `designsafe.apps.api.data.view` as such:
        >>> #fm is an instance of the corresponding AbstracFileManager subclass
        >>> op = getattr(fm, operation)
        >>> op(**kwargs)

        - All required arguments are passed as `kwargs` dictionary. This means 
          that you can implement the required method adding the necessary 
          method arguments, e.g.:
        >>> def file(self, file_id, action, path, **kwargs):

    References:
        https://docs.python.org/2/library/abc.html
        http://zaiste.net/2013/01/abstract_classes_in_python/
    >>> from designsafe.apps.api.data.filemanager import AbstractFileManager
    >>> MyFileManager(AbstractFileManager):
    ...
    """
    __metaclass__ = ABCMeta

    @abstractmethod
    def parse_file_id(self, file_id):
        """
        Stuff
        """
        raise NotImplementedError()

    @abstractmethod
    def listing(self, file_id, **kwargs):
        """
        Lists contents of a folder or details of a file.
        When the main data view calls this method it will send all the keyword 
        arguments as **kwargs. This means that `file_id` will be the URL path 
        call after the necessary routing parts have been removed, i.e. It will 
        not contain the host, operation type or resource type. 
        See designsafe.apps.api.urls comments for more information.

        Args:
            file_id: String of file path to list

        Returns:
            Dictionary with two keys;
              - resource: File System resource that we're listing
              - files: Array of Api file-like objects
        """
        raise NotImplementedError()

    @abstractmethod
    def file(self, file_id, action, path = None, **kwargs):
        """
        Main method to manage a folder or file.
        See the `listing` method for reference of `file_id`.
        When the main data view calls this method it will send all the keyword 
        arguments as **kwargs. 
        If the HTTP Request is of type POST or GET the `kwargs` dictionary will 
        contain the `request.boy` data (given it's a valid JSON object) as well 
        as the uploaded files in the key `files` if any.

        Notes:
            - This method should route all the necessary file specific operations:
              - move
              - rename
              - copy
              - delete
              An example is given below. The type of action should be in the request 
              body JSON object. If it's necessary to specify another filepath for the 
              operation this should also be part of the request JSON body with the 
              key `path`. For instance, when copying a file the request JSON 
              body object should look like this:
              {
                  "action": "copy",
                  "path": "path/to/new/file"
              }

        Args:
            file_id: Url file path.
            action: File action to execute.
            path: File path if necessary.

        Returns:
            Dictionary with two keys:
              - resource: File System resource.
              - file: File on which the operation was executed.
        """
        #get the action from this class.
        file_op = getattr(self, action)
        #execute passing the necessary arguments
        file_op(file_id, path, **kwargs)
        raise NotImplementedError()

    @abstractmethod
    def download(self, file_id, **kwargs):
        """
        Method to create a download link which will be passed onto 
        the client to download a file.

        Args:
            file_id: Url file path

        Returns:
            Dictionary with two keys:
                - link: Short lived link to directly download a file.
                - name: File name to use for the download.
        """
        raise NotImplementedError()

    @abstractmethod
    def search(self, q, **kwargs):
        """
        Method to return search results based on a query.
        The main data view will pass the query string as well as the keyword 
        arguments in the dictionary `kwargs`. 
        The seach query string should be accessible in `q`.

        Args:
            q: Search query string.

        Returns:
            Dictionary with two keys:
                - resource: Resource name.
                - files: Array of serializabe Api file-like objects
        """
        raise NotImplementedError()

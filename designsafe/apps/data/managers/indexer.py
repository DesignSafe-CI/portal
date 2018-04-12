import logging
import datetime
import os
import urllib2
from designsafe.apps.data.models.elasticsearch import IndexedFile
from designsafe.apps.data.managers.elasticsearch import FileManager as ESFileManager

#pylint: disable=invalid-name
logger = logging.getLogger(__name__)
#pylint: enable=invalid-name

class AgaveIndexer(object):
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
    def __init__(self, agave_client=None, *args, **kwargs):
        self.ag = agave_client


    def walk(self, system_id, path, bottom_up=False, yield_base=True):
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
        files = self.ag.files.list(systemId=system_id,
                                    filePath=path)
        for _file in files:
            if _file.name == '.' or _file.name == '..':
                if not yield_base:
                    continue
            if not bottom_up:
                yield _file
            if _file.format == 'folder' and _file.name != '.':
                for sf in self.walk(system_id, _file.path,
                                    bottom_up=bottom_up, yield_base=False):
                    yield sf
            if bottom_up:
                yield _file

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

        resp = self.ag.files.list(systemId=system_id, filePath=urllib2.quote(path))
        folders = []
        files = []
        for _file in resp:
            if _file.name == '.':
                continue
            if _file.format == 'folder':
                folders.append(_file)
            else:
                files.append(_file)
        if not bottom_up:
            yield (path, folders, files)
        for _folder in folders:
            for (spath, sfolders, sfiles) in self.walk_levels(system_id, _folder.path,
                                                              bottom_up=bottom_up):
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
        mgr = ESFileManager(username)
        r, s = mgr.listing(system_id, root)
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
        mgr = ESFileManager(username=username)
        for root, folders, files in self.walk_levels(system_id, path,
                                                     bottom_up=bottom_up):
            logger.debug('system_id: %s, path: %s', system_id, root)

            objs_to_index, docs_to_delete = self._dedup_and_discover(system_id,
                                                username, root, files, folders)
            for d in docs_to_delete:
                logger.debug(u'delete_recursive: %s', os.path.join(d.path, d.name))
                res, search = mgr.listing_recursive(username)
                if res.hits.total:
                    for doc in search.scan():
                        doc.delete(ignore=404)

                d.delete(ignore=404)
                docs_deleted += res.hits.total + 1

            if not full_indexing:
                for o in objs_to_index:
                    logger.debug(u'Indexing: {}'.format(o.path))
                    pems = None
                    if pems_indexing:
                        pems = self.ag.files.listPermissions(
                            systemId=o.system,filePath=o.path)
                    doc = mgr.index(o, pems=pems)
                    docs_indexed += 1
            else:
                folders_and_files = folders + files
                for o in folders_and_files:
                    logger.debug(u'Get or create file: {}'.format(o.path))
                    pems = None
                    if pems_indexing:
                        pems = self.ag.files.listPermissions(
                            systemId=o.system,filePath=o.path)
                    doc = mgr.index(o, pems=pems)
                    docs_indexed += 1

            if levels and (len(root.split('/')) - len(path.split('/')) + 1) >= levels:
                del folders[:]

        if index_full_path:
            path_comp = path.split('/')[:-1]
            for i in range(len(path_comp)):
                file_path = '/'.join(path_comp)
                path, name = os.path.split(path)
                afs = self.ag.files.list(systemId=system_id, filePath=file_path)
                af = afs[0]
                logger.debug(u'Get or create file: {}'.format(af.path))
                pems = None
                if pems_indexing:
                    pems = self.ag.files.listPermissions(
                        systemId=af.system, filePath=af.path)
                doc = mgr.index(af, pems=pems)
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
        mgr = ESFileManager(username=username)
        r, s = mgr.listing_recursive(system_id, path)
        objs = sorted(s.scan(), key = lambda x: len(x.path.split('/')), reverse=bottom_up)
        if levels:
            objs = filter(lambda x: len(x.path.split('/')) <= levels, objs)
        p, n = os.path.split(path)
        if p == '':
            p = '/'
        objs.append(mgr.get(system_id, os.path.join(p, n)))
        for o in objs:
            if len(o.path.split('/')) == 1 and o.name == 'Shared with me':
                continue
            pems = self.ag.files.listPermissions(
                filePath=urllib.quote(os.path.join(o.path, o.name)),
                systemId=system_id)
            o.update(permissions = pems)
            cnt += 1
        return cnt

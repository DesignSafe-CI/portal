from django.conf import settings
from elasticsearch_dsl.query import Q
from elasticsearch import TransportError
from elasticsearch_dsl import Search, DocType
from elasticsearch_dsl.connections import connections
from designsafe.apps.api.data.agave.file import AgaveFile
from designsafe.apps.api.data.agave.elasticsearch import utils as query_utils
from itertools import takewhile
import dateutil.parser
import itertools
import datetime
import logging
import json
import six
import re
import os

logger = logging.getLogger(__name__)

try:
    es_settings = getattr(settings, 'ELASTIC_SEARCH', {})
    default_index = es_settings['default_index']
    cluster = es_settings['cluster']
    hosts = cluster['hosts']
    connections.configure(
        default={
            'hosts': hosts,
            'sniff_on_start': True,
            'sniff_on_connection_fail': True,
            'sniffer_timeout': 60,
            'retry_on_timeout': True,
            'timeout:': 20,
        })
except KeyError as e:
    logger.exception('ELASTIC_SEARCH missing %s' % e)

class ExecuteSearchMixin(object):
    @staticmethod        
    def _execute_search(s, **kwargs):
        """Method to try/except a search and retry if the response is something
            other than a 404 error.

        :param object s: search object to execute

        .. todo:: this should probably be a wrapper so we can use it everywhere.
        """
        #logger.debug('es query: {}'.format(s.to_dict()))
        try:
            res = s.execute()
        except TransportError as e:
            if e.status_code == 404:
                raise
            res = s.execute()
        return res, s

class PaginationMixin(object):
    @staticmethod
    def get_paginate_limits(res, offset = 0, limit = 100, **kwargs):
        offset = int(offset)
        limit = int(limit)
        limit = offset + limit
        if res.hits.total < limit:
            limit = res.hits.total
        if offset > limit:
            offset = 0
            limit = 0
        return offset, limit

def _names_equal(name):
    return all(n==name[0] for n in name[1:])

def _common_prefix(paths):
    levels = zip(*[p.full_path.split('/') for p in paths])
    return '/'.join(x[0] for x in takewhile(_names_equal, levels))

def merge_file_paths(system, username, file_path, s):
    listing = []
    if not s.count():
        return []

    file_path_comps = file_path.strip('/').split('/')
    if file_path == '/' or file_path == '':
        lfp = 1
    else:
        lfp = len(file_path_comps) + 1

    common_paths = {}
    for doc in s.scan():
        if doc.owner == username or doc.full_path.strip('/') == file_path:
            continue


        common_path = '/'.join(doc.full_path.split('/')[:lfp])
        if common_path not in common_paths:
            common_paths[common_path] = [doc]
        else:
            common_paths[common_path].append(doc)

    for key, val in six.iteritems(common_paths):
        #If only one children on the common path key
        #then it's supposed to show on the listing
        if len(val) == 1:
            listing += val
            continue

        common_prefix = _common_prefix(val)
        #If they don't have a common prefix or the level of the common_prefix is the same  
        #as the file_path being listed then they're all on the same level
        #and are children of the listing
        if not common_prefix:
            listing += val
            continue
        
        #Add the common_prefix document to the listing.
        #As long as it's valid.
        d = Object.from_file_path(system, common_prefix.split('/')[0], common_prefix)
        if d:
            listing.append(d)

    return listing

class Object(ExecuteSearchMixin, PaginationMixin, DocType):
    """Class to wrap Elasticsearch (ES) documents.
        
    This class points specifically to the index `designsafe` and the 
    doc_type `objects`. This class implements most of the methods
    that the :class:`~designsafe.apps.api.data.agave.file.AgaveFile`
    class implements. Also, this class implements methods that 
    returns some predefined searches which makes talking to ES easier.

    The reason why we need this class is to keep the ES cache up-to-date
    every time we do a file operation. Meaning, that every time we do a
    file operation using the
    :class:`~designsafe.apps.api.data.agave.file.AgaveFile` we should call
    the same method on an instance of this class. 
    As we can see this class and the 
    :class:`~designsafe.apps.api.data.agave.file.AgaveFile` class share a 
    close relation. This might beg the question if they should just live
    in the same module and maybe any method of an instance of this class
    should only be called from an instance of
    :class:`~designsafe.apps.api.data.agave.file.AgaveFile`.
    The only reason I see for keeping these two classes  separated is 
    because we don't know the future of ES in our implementation. 

    .. note:: every method in this class has a `username` parameter
        this is used to construct the permissions filter. Although
        this might seem a bit insecure it is ok for now. We should
        probably look into using Shield.

    .. todo:: should this class' methods be called **only** from 
        :class:`~designsafe.apps.api.data.agave.file.AgaveFile`?
    .. todo:: create a wrapper to try/except `Unable to sniff hosts` error.
    """
    source = 'agave'

    @classmethod
    def listing(cls, system, username, file_path, **kwargs):
        """Do a listing of one level.

        :param str system: system id
        :param str username: username making the request
        :param str file_path: file path to list

        :returns: list of :class:`Object`
        :rtype: list
        """
        q = Q('filtered',
              query = Q('bool',
                        must = Q({'term': {'path._exact': file_path}})
                        ),
              filter = query_utils.files_access_filter(username, system)
              )
        s = cls.search()
        s.query = q
        s = s.sort({'name._exact': 'asc'})

        res, s = cls._execute_search(s)
        offset, limit = cls.get_paginate_limits(res, **kwargs)

        return res, s[offset:limit]

    @classmethod
    def from_file_path(cls, system, username, file_path):
        """Retrieves a document from the ES index based on a path.

        :param str system: system id
        :param str username: username making the request
        :param str file_path: path of a file

        :returns: instance of this class or None if the file
            doesn't exists in the index
        :rtype: :class:`Object`
        """
        path, name = os.path.split(file_path)
        path = path or '/'
        q = Q('filtered',
             query = Q('bool',
                      must = [
                        Q({'term': {'path._exact': path}}),
                        Q({'term': {'name._exact': name}})
                        ]
                     ),
            filter = query_utils.files_access_filter(username, system)
            )

        s = cls.search()
        s.query = q
        res, s = cls._execute_search(s)
        if res.hits.total:
            return res[0]
        else:
            return None
    @classmethod
    def listing_recursive(cls, system, username, file_path, **kwargs):
        """Do a listing recursevly

        This method will first check if the file_path that is been listing
        is not a shared file, if so, it will use :func:`_listing_recursive`.
        If ``file_path`` is a shared file it will combine the listing into
        common denominators. This approach is neccesary in order to avoid
        showing empty shared directories or directories where there are
        no files shared with the requesting user. This gives the user
        a more fluent navigation.

        .. example::
            **Reasoning behind combining the listing into common 
            denomintaros**.

            Say there are three folders ``a/b``, ``a/c`` and ``a/d``.
            And say a user has shared a few files and directories
            like this:
            - ``a/b/path/to/folder``
            - ``a/b/path/to/folder/file1.txt``
            - ``a/c/path/another/folder``
            - ``a/c/path/another/folder2``
            - ``a/d/file``
            Then the listing should show as this:
            - ``a/b/path/to/folder``
            - ``a/c/path/another``
            - ``a/d/file``
            Thus making a more fluent navigation.
        .. note::
            This function assumes than when listing the root path 
            (``/`` or `` ``) then we are doing a listing of shared
            files.
        """
        owner = file_path.split('/')[0]
        #If we are listing something inside the requesting user's home dir.
        if username == owner or username == 'ds_admin':
            return cls._listing_recursive(system, username, file_path)
        
        #Everything else should be something shared. If we are listing the
        #root path get everything.
        if file_path == '/' or file_path == '':
            q = Q('filtered',
                  filter = query_utils.files_access_filter(username, system)
                  )
            s = cls.search()
            s = s.sort('path._path', 'name._exact')
            s.query = q
            logger.debug('Recursive Listing query: {}'.format(s.to_dict()))
            r, s = cls._execute_search(s)
        else:
            #Get recursive listing for shared path.
            r, s = cls._listing_recursive(system, username, file_path)

        listing = merge_file_paths(system, username, file_path, s)
        r.hits.total = len(listing)
        offset, limit = cls.get_paginate_limits(r, **kwargs)
        return r, listing[offset:limit]

    @classmethod
    def _listing_recursive(cls, system, username, file_path):
        """Do a listing recursively

        This method is an efficient way to recursively do a "listing" of a 
        folder. This is because of the hierarcical tokenizer we have in 
        `path._path`. The returning listing will be sorted by path and name

        :param str system: system id
        :param str username: username making the request
        :param str file_path: path of the folder to list

        :returns: list of :class:`Object`
        :rtype: list

        .. note:: the returned list does not contain the parent file

        Examples:
        ---------
            Sort listing by depth

            .. code-block:: python

                >>> listing = Object.listing_recursive('agave.system.id',
                ...                     'username', 'username/path/folder')
                >>> sorted(listing, key=lambda x: len(x.full_path.split('/')))

            .. note:: Python sorting is stable. In theory we could sort the listing
                alphabetically (default behaivour) and then sort the listing
                by depth and we'll end up with a listing sorted both by depth
                and alphabetically.

        """
        #logger.debug('Using username: {}'.format(username))
        q = Q('filtered',
              query = Q('bool',
                        must = [
                          Q({'term': {'path._path': file_path}})
                          ]
                      ),
              filter = query_utils.files_access_filter(username, system)
              )
        s = cls.search()
        s = s.sort('path._exact', 'name._exact')
        s.query = q
        return cls._execute_search(s)

    @classmethod
    def from_agave_file(cls, username, file_obj, auto_update = False, get_pems = False):
        """Get or create an ES document.

        This method accepts a :class:`~designsafe.apps.api.data.agave.file.AgaveFile`
        object and retrieves the corresponding document from the ES index.
        If the document doesn't exists in the index then it is created.
        If the document exists then that document will be returned, if `auto_update`
        is `True` the document will get upated with the 
        :class:`~designsafe.apps.api.data.agave.file.AgaveFile` object data and returned.
        If `get_pems` is `True` then an agave call to `files.listPermissions`
        is done to retrieve the file's permissions and add them to the document.

        :param str username: username making the request
        :param object file_obj: :class:`~designsafe.apps.api.data.agave.file.AgaveFile` obj
        :param bool auto_update: if set to `True` and the `file_obj` document exists
            then the document will be updated and returned
        :param bool get_pems: if set to `True` permissions will be retrieved by accessing
            `file_obj.permissions`. This usually means that an agave call will be made to
            retrieve the permissions.

        :returns: instance of this class
        :rtype: :class:`Object`

        .. note:: this is the only getter classmethod that implements a "get or create"
            behaviour. This is because we are getting the full 
            :class:`~designsafe.apps.api.data.agave.file.AgaveFile` object which 
            ensures that the document we are creating is a valid one.
        """
        o = cls.from_file_path(file_obj.system, username, file_obj.full_path)
        if o is not None:
            if auto_update:
                o.update(
                    mimeType = file_obj.mime_type,
                    name = file_obj.name,
                    format = file_obj.format,
                    deleted = False,
                    lastModified = file_obj.lastModified.isoformat(),
                    fileType = file_obj.ext or 'folder',
                    agavePath = u'agave://{}/{}'.format(file_obj.system, file_obj.full_path),
                    length = file_obj.length,
                    systemId = file_obj.system,
                    path = file_obj.parent_path,
                    link = file_obj._links['self']['href'],
                    type = file_obj.type
                )
            if get_pems:
                logger.debug('file_obj pems: {}'.format(file_obj.permissions))
                o.update(permissions = file_obj.permissions)
            return o

        o = cls(
            mimeType = file_obj.mime_type,
            name = file_obj.name,
            format = file_obj.format,
            deleted = False,
            lastModified = file_obj.lastModified.isoformat(),
            fileType = file_obj.ext or 'folder',
            agavePath = u'agave://{}/{}'.format(file_obj.system, file_obj.full_path),
            systemTags = [],
            length = file_obj.length,
            systemId = file_obj.system,
            path = file_obj.parent_path,
            keywords = [],
            link = file_obj._links['self']['href'],
            type = file_obj.type
        )
        o.save()
        if get_pems:
            pems = file_obj.permissions
        else:
            path = file_obj.path
            pems_user = path.strip('/').split('/')[0]
            pems = [{
                'username': pems_user,
                'recursive': True,
                'permission': {
                    'read': True,
                    'write': True,
                    'execute': True
                }
            }]

        o.update(permissions = pems)
        o.save()
        return o

    @classmethod
    def search_query(cls, username, q, fields = [], sanitize = True, **kwargs):
        """Search the Elasticsearch index using a query string

        Use a query string to search the ES index. This method will search 
        on the fields **name**, and **keywords**

        :param str username: username making the request
        :param str q: string to query the ES index
        :param list fields: list of strings

        .. note:: In order to make this method scalable more fields can be
            searched by passing a **fields** keyword argument. You can add
            the **systemTags** field like so:
            >>> Object.search('username', 'txt', fields = ['systemTags'])
        """
        if isinstance(fields, basestring):
            fields = fields.split(',')

        search_fields = ['name', 'name._exact', 'keywords']

        if fields:
            search_fields += fields

        sq = Q('filtered',
                query = query_utils.files_wildcard_query(q, search_fields),
                filter = query_utils.files_access_filter(username)
                )
        s = cls.search()
        s.query = sq
        s = s.sort('path._exact', 'name._exact')

        res, s = cls._execute_search(s)
        offset, limit = cls.get_paginate_limits(res, **kwargs)
        #logger.debug('limit: %s. offset: %s' % (limit, offset))
        return res, s[offset:limit]


    def copy(self, username, target_file_path):
        """Copy a document.

        Although creating a copy of a document using this class is farily 
        straight forward (i.e. `o = Object(**doc); o.save()`, this method
        is necessary in order to account for recursive copying i.e. when
        a folder is copied.

        :param str username: username making the request
        :param str path: path to the file to copy

        :returns: instance of this class
        :rtype: :class:`Object`

        .. note:: this method returns the copied document.

        **Examples**:
            Copy a file and print the resulting copied file path

            >>> origin_doc = Object.from_file_path('agave.system.id', 
            ...                 'username', 'username/path/file.txt')
            >>> doc_copy = origin_doc.copy('username', 'file_copy.txt')
            >>> print u'resulting file path: {}'.format(doc_copy.full_path)
        """
        target_path, target_name = os.path.split(target_file_path.strip('/'))
        #check that we got a full file path, else assume is just the name
        if not target_path:
            target_path = self.path

        if self.type == 'dir':
            res, s = self.__class__.listing_recursive(self.systemId, username, os.path.join(self.path, self.name))
            for o in s.scan():
                d = o.to_dict()
                regex = r'^{}'.format(os.path.join(self.path, self.name))
                logger.debug(u'd[path]: {}'.format(d['path']))
                d['path'] = re.sub(regex, 
                                os.path.join(target_path, target_name), 
                                d['path'], count = 1)
                logger.debug(u'changed d[path]: {}'.format(d['path']))
                d['agavePath'] = u'agave://{}/{}'.format(self.systemId, os.path.join(d['path'], d['name']))
                doc = Object(**d)
                doc.save()
        d = self.to_dict()
        d['path'] = target_path
        d['name'] = target_name
        d['agavePath'] = u'agave://{}/{}'.format(self.systemId, os.path.join(d['path'], d['name']))
        doc = Object(**d)
        doc.save()
        self.save()
        return doc

    def delete_recursive(self, username):
        """Delete a file recursively.

        This method works with both files and folders.
        If the document represents a folder then it will 
        recursively delete any childre documents.

        :returns: count of how many documents were deleted
        :rtype: int
        """
        cnt = 0
        if self.type == 'dir':
            res, s = self.__class__.listing_recursive(self.systemId, username, os.path.join(self.path, self.name))
            for o in s.scan():
                o.delete()
                cnt += 1

        self.delete()
        cnt += 1
        return cnt

    @property
    def ext(self):
        """Returns the extension of a file.

        :returns: extension in the form `.[a-z]+` **note the dot**
        :rtype: str
        """
        return os.path.splitext(self.name)[1]

    @property
    def full_path(self):
        """Returns the full path of a file

        :returns: full path of a file
        :rtype: str
        """
        return os.path.join(self.path, self.name)

    @property
    def owner(self):
        """Returns the owner of the file.

        The owner is, basically, the first folder of the filepath

        :returns: owner's username
        :rtype: str
        """
        return self.full_path.strip('/').split('/')[0]

    @property
    def parent_path(self):
        return self.path

    def move(self, username, path):
        """Update document with new path

        :param str username: username making the request
        :param str path: path to update

        :returns: an instance of this class
        :rtype: :class:`Object`
        """
        if self.type == 'dir':
            res, s = self.__class__.listing_recursive(self.systemId, username, os.path.join(self.path, self.name))
            for o in s.scan():
                regex = ur'^{}'.format(os.path.join(self.path, self.name))
                o.update(path = re.sub(regex, os.path.join(path, self.name), 
                                o.path, count = 1),
                         agavePath = u'agave://{}/{}'.format(self.systemId,
                                os.path.join(self.path, self.name))) 
                o.save()
        tail, head = os.path.split(path)
        self.update(path = tail, agavePath = u'agave://{}/{}'.format(self.systemId,
                                                os.path.join(tail, self.name)))
        logger.debug(u'Moved: {}'.format(self.full_path))
        self.save()
        return self


    def rename(self, username, path):
        """Updates a document with a new name.

        :param str username: username making the request
        :param str path: name to upate

        :returns: an instance of this class
        :rtype: :class:`Object`
        """
        #split path arg. Assuming is in the form /file/to/new_name.txt
        tail, head = os.path.split(path)
        #check if we have something in tail.
        #If we don't then we got just the new file name in the path arg.
        if tail == '':
            head = path       
        if self.type == 'dir':
            res, s = self.__class__.listing_recursive(self.systemId, username, os.path.join(self.path, self.name))
            for o in s.scan():
                regex = ur'^{}'.format(os.path.join(self.path, self.name))
                target_path = re.sub(regex, os.path.join(self.path, head), o.path, count = 1)
                o.update(path =  target_path, 
                         agavePath = u'agave://{}/{}'.format(self.systemId,
                                            os.path.join(target_path, o.name)))
                o.save()
        self.update(name = head, 
                    agavePath = u'agave://{}/{}'.format(self.systemId,
                                      os.path.join(self.path, head)))
        self.save()
        return self

    def save(self, **kwargs):
        """Overwrite to become save or update
        """
        doc = Object.from_file_path(self.systemId, self.full_path.split('/')[0], self.full_path)
        if doc:
            setattr(self.meta, 'index', doc.meta.index)
            setattr(self.meta, 'id', doc.meta.id)
            setattr(self.meta, 'doc_type', doc.meta.doc_type)
            doc.update(**self.to_dict())
        return super(Object, self).save(**kwargs)

    def share(self, username, permissions, update_parent_path = True, recursive = True):
        """Update permissions on a document recursively.

        :param str username: username making the request
        :param list permissions: A list of dicts with two keys ``user_to_share`` and ``permission`` 
            string representing the permission to set 
            [READ | WRITE | EXECUTE | READ_WRITE | READ_EXECUTE | WRITE_EXECUTE | ALL | NONE]
        :param bool update_parent_path: if set it will update the permission on all the parent folders.
        :param bool recursive: if set it will update the permissions recursively.
        """
        if recursive and self.type == 'dir':
            res, s = self.__class__.listing_recursive(self.systemId, username, os.path.join(self.path, self.name))
            for o in s.scan():
                o.update_pems(permissions)
       
        #Commenting out to try new pems model 
        #if update_parent_path:
        #    self._update_pems_on_parent_path(permissions)

        self.update_pems(permissions)
        self.save()
        return self

    def update_metadata(self, meta_obj):
        """Update metadata of an object

        The matadata this method updates is only the user metadata.
        This first version only focuses on **keywords**.
        This metadata should grow in the future.

        :param obj meta_obj: object with which the document will be updated

        .. warning:: This method blindly replaces the data in the 
            saved document. The only sanitization it does is to remove
            repeated elements.
        """

        keywords = list(set(meta_obj['keywords']))
        keywords = [kw.strip() for kw in keywords]
        self.update(keywords = keywords)
        self.save()
        logger.debug(self.keywords)
        return self

    def _pems_args_to_es_pems_list(self, permissions):
        pems = []
        for pem in permissions:
            d = {
                'username': pem['user_to_share'],
                'recursive': pem.get('recursive', False),
                'permission': {
                    'read': True if pem['permission'] in ['READ_WRITE', 'READ_EXECUTE', 'READ', 'ALL'] else False,
                    'write': True if pem['permission'] in ['READ_WRITE', 'WRITE_EXECUTE', 'WRITE', 'ALL'] else False,
                    'execute': True if pem['permission'] in ['READ_EXECUTE', 'WRITE_EXECUTE', 'EXECUTE', 'ALL'] else False
                }
            }
            pems.append(d)
        return pems

    @property
    def owner(self):
        if self.path == '/':
            owner = self.name
        else:
            owner = self.path.split('/')[0]
        return owner

    def _user_has_access(self, username, file_name_filter = None, pem = 'read'):
        owner = self.owner
        if self.type != 'dir':
            username_pems = filter(lambda x: x['username'] == username, self.permissions)
            check = username_pems[0]['permission'][pem]
        else:
            res, s = Object.listing(self.systemId, owner, owner)
            check = False
            for o in s.scan():
                if file_name_filter is not None and o.name == file_name_filter:
                    continue
                pems = o.permissions
                username_pems = filter(lambda x: x['username'] == username, pems)
                logger.debug('username_pems: {} on file: {}'.format(username_pems, o.full_path))
                if len(username_pems) > 0 and username_pems[0]['permission'][pem]:
                    check = True
                    break
        return check

    def _filter_revoke_pems_list(self, pems_args):
        owner = self.owner
        revoke = filter(lambda x: x['permission'] == 'NONE', pems_args)
        logger.debug('revoke: {}'.format(revoke))
        if len(revoke) > 0:
            revoke_usernames = [o['user_to_share'] for o in revoke]
            home_dir = Object.from_file_path(self.systemId, owner, owner)
            if self.parent_path == owner:
                file_name_filter = self.name
            else:
                file_name_filter = None
            for username in revoke_usernames:
                if home_dir._user_has_access(username, file_name_filter = file_name_filter):
                    pems_args = filter(lambda x: x['user_to_share'] != username, pems_args)

        return pems_args

    def _update_pems_on_parent_path(self, pems_args):
        pems_args = self._filter_revoke_pems_list(pems_args)
        if len(pems_args) == 0:
            return False
        
        path_comps = self.parent_path.split('/')
        parents_pems_args = []
        for p in pems_args:
            d = {'user_to_share': p['user_to_share'],
                 'permission': 'READ' if p['permission'] != 'NONE' else 'NONE'                }
            parents_pems_args.append(d)

        for i in range(len(path_comps)):
            file_path = u'/'.join(path_comps)
            logger.debug('ES updating pems on parent: %s' % file_path)
            doc = Object.from_file_path(self.systemId, self.parent_path.split('/')[0], 
                                        file_path)
            doc.share(self.parent_path.split('/')[0], 
                      parents_pems_args, 
                      update_parent_path = False, 
                      recursive = False)
            path_comps.pop()
        return True

    def update_pems(self, permissions, recursive = True):
        """Update permissions on a document.

        When updating permissions in an ElasticSearch (ES) document, we have to create the 
        list of objects necessary. This list is the same as the response from 
        *agavepy*'s ``files.listPermissions``. We translate between the ``permissions``
        list that this function gets as a parameter to the corresponding list with 
        `func:_pems_args_to_es_pems_list`. Once we have this list we have to overwrite (or remove)
        the corresponding list elements. We do this by filtering the pems list on the document
        with the translated pems list using the *username* as uniqueness. We then append the
        translated pems to the document's pems list and upate the document. 

        **Removing Permissions**: When removing permissions we first need to check that the
        parent folder does not have the ``recursive`` flag set for that username. If it has
        the ``recursive`` flag set then we **can not** remove permissions for that username
        on that specific file. 

        :param str username_to_update: username with whom we are going to share this document
        :param list permissions: A list of dicts with two keys ``user_to_share`` and ``permission`` 
            string representing the permission to set 
            [READ | WRITE | EXECUTE | READ_WRITE | READ_EXECUTE | WRITE_EXECUTE | ALL | NONE]
        """
        pems = getattr(self, 'permissions', [])
        pems_translated = self._pems_args_to_es_pems_list(permissions)
        pems_usernames = [o['username'] for o in pems_translated]

        pems_to_add = filter(lambda x: not (x['permission']['read'] == False and x['permission']['write'] == False and x['permission']['execute'] == False), pems_translated)

        #pems_to_remove = filter(lambda x: x['permission']['read'] == False and x['permission']['write'] == False and x['permission']['execute'] == False, pems_translated)

        pems_to_persist = filter(lambda x: x['username'] not in pems_usernames, pems)

        pems_to_persist += pems_to_add
        #logger.debug('updating permissions on {} with {}'.format(self.meta.id, user_pems))
        logger.debug('updating permissions: file: {} , pems: {}'.format(self.full_path, pems_to_add))
        self.update(permissions = pems_to_persist)
        self.save()
        return self
        
    def to_file_dict(self):
        """Returns a dictionary correctly formatted
            as a data api response.

        This method first constructs a dictionary that looks like
        a response from an agave call to `files.listing`. After this
        it instantiates a :class:`~designsafe.apps.api.agave.files.AgaveFile` object
        and returns the result of :meth:`~designsafe.apps.api.agave.files.AgaveFile.to_dict`.
        We hand off the dict construction to the 
        :class:`~designsafe.apps.api.agave.files.AgaveFile` class so we don't have to
        implement it twice.

        :param string pems_user: User to filter permissions for

        :returns: dict object representation of a file
        :rtype: dict

        .. note:: in future releases the ES documents in the index should look like
            the response of an agave call to `files.listing`. We would need to keep
            this method to hand of the dict construction to the
            :class:`~designsafe.apps.api.agave.files.AgaveFile` class
        """
        try:
            lm = dateutil.parser.parse(self.lastModified)
        except AttributeError:
            lm = datetime.datetime.now()

        pems = self.to_dict()['permissions']

        wrap = {
            'format': getattr(self, 'format', 'folder'),
            'lastModified': lm,
            'length': self.length,
            'mimeType': self.mimeType,
            'name': self.name,
            'path': os.path.join(self.path, self.name).strip('/'),
            'permissions': pems,
            'system': self.systemId,
            'type': self.type,
            '_pems': pems
        }
        f = AgaveFile(wrap = wrap)
        extra = {
            'meta':
            {
                'keywords': self.to_dict().get('keywords', list([])), 
                'systemTags': self.to_dict().get('systemTags', list([]))
            }
        }
        return f.to_dict(extra = extra)

    class Meta:
        index = default_index
        doc_type = 'objects'

class Project(ExecuteSearchMixin, PaginationMixin, DocType):
    @classmethod
    def from_name(cls, name, fields = None):
        name = re.sub(r'\.groups$', '', name)
        q = Q({'term': {'name._exact': name}})
        s = cls.search()
        s.query = q

        if fields is not None:
            s = s.fields(fields)
        res, s = cls._execute_search(s)
        if res.hits.total:
            return res[0]
        else:
            return None

    @classmethod
    def search_query(cls, system_id, username, qs, fields = [], **kwargs):
        query_fields = ["description",
                  "endDate",
                  "equipment.component",
                  "equipment.equipmentClass",
                  "equipment.facility",
                  "fundorg"
                  "fundorgprojid",
                  "name",
                  "organization.name",
                  "pis.firstName",
                  "pis.lastName",
                  "title"]
        if fields is not None:
            query_fields += fields

        q = query_utils.files_wildcard_query(qs, query_fields)

        s = cls.search()
        s.query = q
        s = s.sort('name._exact')

        res, s = cls._execute_search(s)
        offset, limit = cls.get_paginate_limits(res, **kwargs)

        return res, s[offset:limit]

    @classmethod
    def projects_to_files(self, projects):
        for p in projects:
            doc = PublicObject.from_file_path(p.systemId, 
                        u'/{}'.format(p.projectPath.strip('/')))
            if doc is not None:
                yield doc
            else:
                logger.warning(u'No file found for {}'.format(p.projectPath))

    class Meta:
        index = 'nees'
        doc_type = 'project'

class Experiment(ExecuteSearchMixin, PaginationMixin, DocType):
    @classmethod
    def list_by_project(cls, project, fields = None):
        project = re.sub(r'\.groups$', '', project)
        q = Q({'term': {'project._exact': project}})
        s = cls.search()
        s.query = q
        if fields is not None:
            s = s.fields(fields)

        s = s.sort('name._exact')
        res, s = cls._execute_search(s)
        return res, s

    @classmethod
    def from_name_and_project(cls, project, name, fields = None):
        project = re.sub(r'\.groups$', '', project)
        q = Q('bool',
              must = [Q({'term': {'name._exact': name}}),
                      Q({'term': {'project._exact': project}})]
             )
        s = cls.search()
        s.query = q
        if fields is not None:
            s = s.fields(fields)
        res, s = cls._execute_search(s)
        if res.hits.total:
            return res[0]
        else:
            return None
   
    @classmethod 
    def search_query(cls, system_id, username, qs, fields = None):
        query_fields = ["description",
                  "facility.country"
                  "facility.name",
                  "facility.state",
                  "name._exact",
                  "name",
                  "project",
                  "startDate",
                  "title"]
        if fields is not None:
            query_fields += fields

        q = query_utils.files_wildcard_query(q, query_fields)
        s = cls.search()
        s.query = q
        if fields is not None:
            s = s.fields(fields)

        s = s.sort('name._exact')

        res, s = cls._execute_search(s)
        offset, limit = cls.get_paginate_limits(res, **kwargs)

        return res, s[offset:limit]

    class Meta:
        index = 'nees'
        doc_type = 'experiment'

class PublicObject(ExecuteSearchMixin, PaginationMixin, DocType):
    def __init__(self, *args, **kwargs):
        super(PublicObject, self).__init__(*args, **kwargs)
        self.project_ = None
        self.experiment_ = None
        self.trail_ = None
        self.all_experiments_ = None

    @classmethod
    def listing_recursive(cls, system_id, path):
        path = path or '/'
        q = Q('bool',
                must = [Q({'term': {'path._path': path}}),
                        Q({'term': {'systemId': system_id}})]
              )
        s = cls.search()
        s.query = q
        return cls._execute_search(s)

    @classmethod
    def from_file_path(cls, system_id, file_path):
        path, name = os.path.split(file_path)
        path = path or '/'
        q = Q('bool',
                must = [Q({'term': {'path._exact': path}}),
                        Q({'term': {'name._exact': name}}),
                        Q({'term': {'systemId': system_id}})]
              )
        s = cls.search()
        s.query = q
        res, s = cls._execute_search(s)
        if res.hits.total:
            return res[0]
        else:
            return None

    @classmethod
    def listing(cls, system_id, path, **kwargs):
        path = path or '/'
        q = Q('bool',
               must = [Q({'term': {'path._exact': path}}),
                       Q({'term': {'systemId': system_id}})]
               )
        s = cls.search()
        s = s.sort({'project._exact': 'asc'})
        s.query = q
        logger.debug('public listing queyr: {}'.format(s.to_dict()))
        res, s = cls._execute_search(s)
        offset, limit = cls.get_paginate_limits(res, **kwargs)
        logger.debug('offset: {}, limit: {}'.format(offset, limit))
        return res, s[offset:limit]

    @classmethod
    def search_query_with_projects(cls, system_id, username, q, fields = [], **kwargs):
        if isinstance(fields, basestring):
            fields = fields.split(',')

        files_limit = limit = int(kwargs.pop('limit', 100))
        files_offset = offset = int(kwargs.pop('offset', 0))
        page = offset / 100
        #logger.debug('offset: {}, limit: {}'.format(offset, limit))
        projects_res, projects_s = Project.search_query(system_id, username, q, 
                                        fields, limit = limit, offset = offset, 
                                        **kwargs)

        #logger.debug('projs total: {}'.format(projects_res.hits.total)) 
        if projects_res.hits.total:
            if projects_res.hits.total - offset > limit:
                return projects_res, projects_s
            else:
                projects_overflow = projects_res.hits.total - ( (projects_res.hits.total / 100) * 100 )
                files_offset = offset - projects_overflow
                if files_offset < 0:
                    files_offset = 0
                
                files_limit = limit 
                if (projects_res.hits.total / 100) >= page:
                    files_limit = limit - projects_overflow

        #logger.debug('files offset: {}, files limit: {}'.format(files_offset, files_limit))
        files_res, files_s = cls.search_query(system_id, username,
                                    q, fields, limit = files_limit, offset = files_offset, **kwargs)
        #logger.debug('files total: {}'.format(files_res.hits.total)) 
        return files_res, itertools.chain(Project.projects_to_files(projects_s), files_s)
    
    @classmethod
    def search_query(cls, system_id, username, q, fields = [], **kwargs):
        if isinstance(fields, basestring):
            fields = fields.split(',')

        query_fields = ["name", "name._exact"]
        
        if fields is not None:
            query_fields += fields

        s = cls.search()
        s.query = query_utils.files_wildcard_query(q, query_fields)

        s = s.sort('type', 'path._exact', 'name._exact')

        res, s = cls._execute_search(s)
        offset, limit = cls.get_paginate_limits(res, **kwargs)

        #logger.debug('files offset: {}, files limit: {}'.format(offset, limit))

        return res, s[offset:limit]

    @property
    def project_meta(self):
        if self.project_:
            return self.project_

        p = Project.from_name(self.project)
        self.project_ = p
        return self.project_ 

    @property
    def experiment_meta(self):
        if self.experiment_ or len(self.full_path.split('/')) <= 1:
            return self.experiment_

        experiment_name = self.full_path.split('/')[1]
        e = Experiment.from_name_and_project(self.project, experiment_name)
        self.experiment_ = e
        return self.experiment_

    @property
    def all_experiments_meta(self):
        try:
            if self.all_experiments_:
                return self.all_experiments_

            res, s = Experiment.list_by_project(self.project)
            self.all_experiments_ = s

            return self.all_experiments_
        except Exception as e:
            logger.error(e, exc_info=True)
  
    @property
    def parent_path(self):
        return self.path

    def experiment_title(self, trail_path):
        if trail_path != '' and trail_path != '/':
            if self.experiment_meta is not None:
                return self.experiment_meta.title
        return None

    @property
    def trail(self):
        try:
            if self.trail_ is None:
                self.trail_ = []
                if self.parent_path != '' and self.parent_path != '/':
                    path_parts = self.parent_path.split('/')
                    for i, c in enumerate(path_parts):
                        trail_path = '/'.join(path_parts[:i])
                        trail_meta = dict(
                            source = 'public',
                            system = self.systemId,
                            id = os.path.join(self.systemId, trail_path, c),
                            path = trail_path,
                            name = c,
                            type = 'folder',
                            project = self.project_meta.title,
                            experiment = self.experiment_title(trail_path)
                        )
                        self.trail_.append(trail_meta)
            return list(self.trail_)
        except:
            logger.debug('Error', exc_info=True)
            raise
    
    @property
    def ext(self):
        return os.path.splitext(self.name)[1]

    @property
    def full_path(self):
        return os.path.join(self.path.strip('/'), self.name)

    @property
    def file_id(self):
        return os.path.join(self.systemId, self.full_path)

    def get_full_metadata(self):
        project = self.project_meta
        experiments = self.all_experiments_meta
        d = {
            'project': project,
            'experiments': [doc.to_dict() for doc in experiments]
        }
        return d
        
    def to_dict(self, get_id = False, def_pems = None, with_meta = True, *args, **kwargs):
        d = super(PublicObject, self).to_dict(*args, **kwargs)
        d['ext'] = self.ext
        d['id'] = self.file_id
        d['size'] = self.length
        d['system'] = self.systemId
        d['source'] = 'public'
        d['type'] = 'folder' if self.type == 'dir' else 'file'
        d['_trail'] = [o.to_dict() for o in self.trail] if self.trail else []
        if get_id:
            d['_id'] = self._id
        if def_pems:
            d['_pems'] = list(def_pems)

        if with_meta:
            e = self.experiment_meta
            p = self.project_meta
            d['metadata'] = {
                'experiment': e.to_dict() if e is not None else {},
                'project': p.to_dict() if p is not None else {},
                'experiments': [e.to_dict() for e in self.all_experiments_meta] if self.all_experiments_meta is not None else []
            }
        return d

    class Meta:
        index = 'nees'
        doc_type = 'object'



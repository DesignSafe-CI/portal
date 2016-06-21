from django.conf import settings
from elasticsearch_dsl.query import Q
from elasticsearch import TransportError
from elasticsearch_dsl import Search, DocType
from elasticsearch_dsl.connections import connections
from designsafe.apps.api.data.agave.file import AgaveFile
from designsafe.apps.api.data.agave.elasticsearch import utils as query_utils
import dateutil.parser
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
    def _execute_search(s):
        """Method to try/except a search and retry if the response is something
            other than a 404 error.

        :param object s: search object to execute

        .. todo:: this should probably be a wrapper so we can use it everywhere.
        """
        logger.debug('es query: {}'.format(s.to_dict()))
        try:
            res = s.execute()
        except TransportError as e:
            if e.status_code == 404:
                raise
            res = s.execute()
        return res, s

class Object(ExecuteSearchMixin, DocType):
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
    def listing(cls, system, username, file_path):
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
        return cls._execute_search(s)

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
    def listing_recursive(cls, system, username, file_path):
        """Do a listing recursively

        This method is an efficient way to recursively do a "listing" of a 
        folder. This is because of the hierarcical tokenizer we have in 
        `path._path`. There is a caveat about this recurisve listing.
        The returned object is a list of instances of this class, but sorting
        is not ensured on this list. Sorting this list is left to the consumer
        of the api.

        :param str system: system id
        :param str username: username making the request
        :param str file_path: path of the folder to list

        :returns: list of :class:`Object`
        :rtype: list

        .. note:: sorting is not ensure on the returned list
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
        q = Q('filtered',
              query = Q('bool',
                        must = [
                          Q({'term': {'path._path': file_path}})
                          ]
                      ),
              filter = query_utils.files_access_filter(username, system)
              )
        s = cls.search()
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

        search_fields = ['name._exact', 'keywords']

        if fields:
            search_fields += fields

        sq = Q('filtered',
                query = query_utils.files_wildcard_query(q, search_fields),
                filter = query_utils.files_access_filter(username)
                )
        s = cls.search()
        s.query = sq
        logger.debug('search query: {}'.format(s.to_dict()))
        return cls._execute_search(s)


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
        
        if update_parent_path:
            self._update_pems_on_parent_path(permissions)

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
                'recursive': True,
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

    def update_pems(self, permissions):
        """Update permissions on a document.

        :param str username_to_update: username with whom we are going to share this document
        :param list permissions: A list of dicts with two keys ``user_to_share`` and ``permission`` 
            string representing the permission to set 
            [READ | WRITE | EXECUTE | READ_WRITE | READ_EXECUTE | WRITE_EXECUTE | ALL | NONE]
        """
        pems = getattr(self, 'permissions', [])
        pems_to_add = self._pems_args_to_es_pems_list(permissions)
        pems_usernames = [o['username'] for o in pems_to_add]
        pems_to_add = filter(lambda x: not (x['permission']['read'] == False and x['permission']['write'] == False and x['permission']['execute'] == False), pems_to_add)
        user_pems = filter(lambda x: x['username'] not in pems_usernames, pems)
        user_pems += pems_to_add
        logger.debug('updating permissions on {} with {}'.format(self.meta.id, user_pems))
        self.update(permissions = user_pems)
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

class Project(ExecuteSearchMixin, DocType):
    @classmethod
    def from_name(cls, name, fields = None):
        name = re.sub(r'\.groups$', '', name)
        q = Q({'term': {'name._exact': name}})
        s = cls.search()
        s.query = q

        if fields is not None:
            s.fields(fields)
        return cls._execute_search(s)

    @classmethod
    def search_query(cls, system_id, username, qs, fields = None):
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
        q = {"query": { "query_string": { "fields":query_fields, "query": qs}}}
        if fields is not None:
            q['fields'] = fields
        s = cls.search()
        s.update_from_dict(q)
        return cls._execute_search(s)

    @classmethod
    class Meta:
        index = 'nees'
        doc_type = 'project'

class Experiment(ExecuteSearchMixin, DocType):
    @classmethod
    def from_project(cls, project, fields = None):
        project = re.sub(r'\.groups$', '', project)
        q = {"query":{"bool":{"must":[{"term":{"project._exact":project}}]}} }
        if fields is not None:
            q['fields'] = fields
        s = cls.search()
        s.update_from_dict(q)
        return cls._execute_search(s)

    @classmethod
    def from_name_and_project(cls, project, name, fields = None):
        project = re.sub(r'\.groups$', '', project)
        q = {"query":{"bool":{"must":[{"term":{"name._exact":name}}, {"term": {"project._exact":project}}]}} }
        if fields is not None:
            q['fields'] = fields
        s = cls.search()
        s.update_from_dict(q)
        return cls._execute_search(s)
   
    @classmethod 
    def search_query(cls, system_id, username, qs, fields = None):
        search_fields = ["description",
                  "facility.country"
                  "facility.name",
                  "facility.state",
                  "name",
                  "project",
                  "startDate",
                  "title"]
        #qs = '*{}*'.format(qs)
        q = {"query": { "query_string": { "fields":search_fields, "query": qs}}}
        if fields is not None:
            q['fields'] = fields
        s = cls.search()
        s.update_from_dict(q)
        return cls._execute_search(s)

    class Meta:
        index = 'nees'
        doc_type = 'experiment'

class PublicObject(ExecuteSearchMixin, DocType):
    def __init__(self, *args, **kwargs):
        super(PublicObject, self).__init__(*args, **kwargs)
        self.project_title_ = None
        self.project_name_ = None
        self.experiment_name_ = None
        self.trail_ = None

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
                        Q({'term': {'name._exact': path}}),
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
    def listing(cls, system_id, path):
        path = path or '/'
        q = Q('bool',
               must = [Q({'term': {'path._exact': path}}),
                       Q({'term': {'systemId': system_id}})]
               )
        s = cls.search()
        s.query = q
        logger.debug('public object listing: {}'.format(s.to_dict()))
        return cls._execute_search(s)
    
    @classmethod
    def search_query(cls, system_id, username, q, fields = [], **kwargs):
        if isinstance(fields, basestring):
            fields = fields.split(',')

        query_fields = ["name._exact", "project._exact"]
        
        if fields is not None:
            query_fields += fields

        s = cls.search()
        s.query = query_utils.files_wildcard_query(q, query_fields)
        logger.debug('public query string: {}'.format(s.to_dict()))
        return cls._execute_search(s)
  
    def _set_project_title_and_name(self): 
        r, s = Project.from_name(self.project, ['title', 'name'])
        if r.hits.total:
            self.project_title_ = r[0].title[0]
            self.project_name_ = r[0].name[0]

    @property
    def project_title(self):
        if self.project_title_ is None or self.project_name_ is None:
            self._set_project_title_and_name()

        return self.project_title_

    @property
    def project_name(self):
        if self.project_title_ is None or self.project_name_ is None:
            self._set_project_title_and_name()

        return self.project_name_

    @property
    def experiment_name(self):
        path_comps = self.path.split('/')
        exp_id = None
        if len(path_comps) >= 2:
            exp_id = path_comps[1]

        if self.experiment_name_ is None and exp_id is not None:
            r, s = Experiment.from_name_and_project(self.project, exp_id, ['title'])
            if r.hits.total:
                self.experiment_name_ = r[0].title[0]

        return self.experiment_name_

    @property
    def parent_path(self):
        return self.path

    @property
    def trail(self):
        try:
            if self.trail_ is None:
                self.trail_ = []
                if self.parent_path != '' and self.parent_path != '/':
                    path_parts = self.parent_path.split('/')
                    for i, c in enumerate(path_parts):
                        trail_path = '/'.join(path_parts[:i])
                        self.trail_.append(dict(
                            source = 'public',
                            system = self.systemId,
                            id = os.path.join(self.systemId, trail_path, c),
                            path = trail_path,
                            name = c,
                            type = 'folder'
                        ))
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
        
    def to_dict(self, get_id = False, def_pems = None, *args, **kwargs):
        d = super(PublicObject, self).to_dict(*args, **kwargs)
        d['ext'] = self.ext
        d['id'] = self.file_id
        d['size'] = self.length
        d['system'] = self.systemId
        d['source'] = 'public'
        d['type'] = 'folder' if self.type == 'dir' else 'file'
        d['projectTitle'] = self.project_title
        d['projectName'] = self.project_name
        d['experimentName'] = self.experiment_name
        d['_trail'] = [o.to_dict() for o in self.trail] if self.trail else []
        if get_id:
            d['_id'] = self._id
        if def_pems:
            d['_pems'] = list(def_pems)
        return d

    class Meta:
        index = 'nees'
        doc_type = 'object'



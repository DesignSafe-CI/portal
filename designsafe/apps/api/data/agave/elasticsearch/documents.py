from django.conf import settings
from elasticsearch_dsl import Search, DocType
from elasticsearch_dsl.query import Q
from elasticsearch_dsl.connections import connections
from elasticsearch_dsl.utils import AttrList
from elasticsearch import TransportError
from designsafe.apps.api.data.agave.file import AgaveFile
import dateutil.parser
import datetime
import logging
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


class Object(DocType):
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
        q = {"query":{"filtered":{"query":{"bool":{"must":[{"term":{"path._exact":file_path}}, {"term": {"systemId": system}}]}},"filter":{"bool":{"should":[{"term":{"owner":username}},{"terms":{"permissions.username":[username, "world"]}}], "must_not":{"term":{"deleted":"true"}} }}}}}
        s = cls.search()
        s.update_from_dict(q)
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
        q = {"query":{"filtered":{"query":{"bool":{"must":[{"term":{"path._exact":path}},{"term":{"name._exact":name}}, {"term": {"systemId": system}}]}},"filter":{"bool":{"must_not":{"term":{"deleted":"true"}}}}}}}
        if username is not None:
            q['query']['filtered']['filter']['bool']['should'] = [{"term":{"owner":username}},{"terms":{"permissions.username":[username, "world"]}}] 

        s = cls.search()
        s.update_from_dict(q)
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
        q = {"query":{"filtered":{"query":{"bool":{"must":[{"term":{"path._path":file_path}}, {"term": {"systemId": system}}]}},"filter":{"bool":{"should":[{"term":{"owner":username}},{"terms":{"permissions.username":[username, "world"]}}], "must_not":{"term":{"deleted":"true"}} }}}}}
        s = cls.search()
        s.update_from_dict(q)
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
                    systemTags = [],
                    length = file_obj.length,
                    systemId = file_obj.system,
                    path = file_obj.parent_path,
                    keywords = [],
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
        if sanitize:
            q = re.sub('[^\w" ]', '', q)
            q = q.replace('"', '\"')
            if isinstance(fields, basestring):
                fields = fields.split(',')
        #logger.debug('q: {}. fields: {}'.format(q, fields))
        search_fields = ['name', 'keywords']
        if fields:
            search_fields += fields
        sq = { "query": { "filtered": { "query": { "query_string": { "fields":list(set(search_fields)), "query": "*%s*" % q}}, "filter":{"bool":{"should":[ {"term":{"owner":username}},{"term":{"permissions.username":username}}], "must_not":{"term":{"deleted":"true"}}}}}}}
        s = cls.search()
        s.update_from_dict(sq)
        logger.debug('search query: {}'.format(s.to_dict()))
        return cls._execute_search(s)

    @staticmethod        
    def _execute_search(s):
        """Method to try/except a search and retry if the response is something
            other than a 404 error.

        :param object s: search object to execute

        .. todo:: this should probably be a wrapper so we can use it everywhere.
        """
        try:
            res = s.execute()
        except TransportError as e:
            if e.status_code == 404:
                raise
            res = s.execute()
        return res, s

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

    def share(self, username, user_to_share, permission):
        """Update permissions on a document recursively.

        :param str username: username making the request
        :param str user_to_share: username with whom we are going to share this document
        :param str permission: string representing the permission to set 
            [READ | WRITE | EXECUTE | READ_WRITE | READ_EXECUTE | WRITE_EXECUTE | ALL | NONE]
        """
        if self.type == 'dir':
            res, s = self.__class__.listing_recursive(self.systemId, username, os.path.join(self.path, self.name))
            for o in s.scan():
                o.update_pems(user_to_share, permission)
        
        path_comps = self.path.split('/')
        for i in range(len(path_comps)):
            doc_path = '/'.join(path_comps)
            doc = Object.from_file_path(self.systemId, username, doc_path)
            doc.update_pems(user_to_share, permission)
            path_comps.pop()
            doc.save()

        self.update_pems(user_to_share, permission)
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
        meta_obj = list(set(meta_obj))
        self.update(keywords = meta_obj)
        self.save()
        return self

    def update_pems(self, user_to_share, pem):
        pems = getattr(self, 'permissions', [])
        pem_to_add = {
                'username': user_to_share,
                'recursive': True,
                'permission': {
                    'read': True if pem in ['READ_WRITE', 'READ_EXECUTE', 'READ', 'ALL'] else False,
                    'write': True if pem in ['READ_WRITE', 'WRITE_EXECUTE', 'WRITE', 'ALL'] else False,
                    'execute': True if pem in ['READ_EXECUTE', 'WRITE_EXECUTE', 'EXECUTE', 'ALL'] else False
                }
            }
        user_pems = filter(lambda x: x['username'] != user_to_share, pems)
        user_pems.append(pem_to_add)
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
        return f.to_dict()

    class Meta:
        index = default_index
        doc_type = 'objects'

class Project(DocType):
    
    def search_by_name(self, name, fields = None):
        #TODO: This should be a classmeethod
        name = re.sub(r'\.groups$', '', name)
        q = {"query":{"bool":{"must":[{"term":{"name._exact":name}}]}} }
        if fields is not None:
            q['fields'] = fields
        s = self.__class__.search()
        s.update_from_dict(q)
        return s.execute(), s

    def search_query(self, system_id, username, qs, fields = None):
        #TODO: This should be a classmeethod
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
        #qs = '*{}*'.format(qs)
        q = {"query": { "query_string": { "fields":query_fields, "query": qs}}}
        if fields is not None:
            q['fields'] = fields
        s = self.__class__.search()
        s.update_from_dict(q)
        return s.execute(), s

    class Meta:
        index = 'nees'
        doc_type = 'project'

class Experiment(DocType):

    def search_by_project(self, project, fields = None):
        #TODO: This should be a classmeethod
        project = re.sub(r'\.groups$', '', project)
        q = {"query":{"bool":{"must":[{"term":{"project._exact":project}}]}} }
        if fields is not None:
            q['fields'] = fields
        s = self.__class__.search()
        s.update_from_dict(q)
        return s.execute(), s

    def search_by_name_and_project(self, project, name, fields = None):
        #TODO: This should be a classmeethod
        project = re.sub(r'\.groups$', '', project)
        q = {"query":{"bool":{"must":[{"term":{"name._exact":name}}, {"term": {"project._exact":project}}]}} }
        if fields is not None:
            q['fields'] = fields
        s = self.__class__.search()
        s.update_from_dict(q)
        return s.execute(), s

    def search_query(self, system_id, username, qs, fields = None):
        #TODO: This should be a classmeethod
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
        s = self.__class__.search()
        s.update_from_dict(q)
        return s.execute(), s

    class Meta:
        index = 'nees'
        doc_type = 'experiment'

class PublicObject(DocType):
    def __init__(self, *args, **kwargs):
        super(PublicObject, self).__init__(*args, **kwargs)
        self.project_title_ = None
        self.project_name_ = None
        self.experiment_name_ = None

    @staticmethod        
    def _execute_search(s):
        """Method to try/except a search and retry if the response is something
            other than a 404 error.

        :param object s: search object to execute

        .. todo:: this should probably be a wrapper so we can use it everywhere.
        """
        try:
            res = s.execute()
        except TransportError as e:
            if e.status_code == 404:
                raise
            res = s.execute()
        return res, s

    @classmethod
    def listing_recursive(self, system_id, username, path):
        q = {"query":{"bool":{"must":[{"term":{"path._path":path}}, {"term": {"systemId": system_id}}]}} }
        s = self.__class__.search()
        s.update_from_dict(q)
        return self._execute_search(s)

    @classmethod
    def from_file_path(self, system_id, username, file_path):
        path, name = os.path.split(file_path)
        path = path or '/'
        q = {"query":{"bool":{"must":[{"term":{"path._exact":path}},{"term":{"name._exact":name}}, {"term": {"systemId": system_id}}]}}}
        s = self.__class__.search()
        s.update_from_dict(q)
        res, s = self._execute_search(s)
        if res.hits.total:
            return res[0]
        else:
            return None

    @classmethod
    def listing(self, system_id, path):
        q = {"query":{"bool":{"must":[{"term":{"path._exact":path}}, {"term": {"systemId": system_id}}] }}}
        s = self.__class__.search()
        s.update_from_dict(q)
        return self._execute_search(s)
    
    @classmethod
    def search_query(self, system_id, username, q, fields = None):
        if sanitize:
            q = re.sub('[^\w" ]', '', q)
            q = q.replace('"', '\"')
            if isinstance(fields, basestring):
                fields = fields.split(',')

        query_fields = ["name", "path", "project"]
        
        if fields is not None:
            query_fields += fields

        qd = {"query": { "query_string": { "fields":query_fields, "query": q}}}
        s = self.__class__.search()
        s.update_from_dict(q)
        return s.execute(), s

    #def search_project_folders(self, system_id, username, project_names, fields = None):
    #    q = {'query': {'filtered': { 'query': { 'terms': {'name._exact': project_names}}, 'filter': {'term': {'path._exact': '/'}}}}}
    #    if fields is not None:
    #        q['fields'] = fields
    #    s = self.__class__.search()
    #    s.update_from_dict(q)

    #    return s.execute(), s
  
    def _set_project_title_and_name(self): 
        r, s = Project().search_by_name(self.project, ['title', 'name'])
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
        if self.experiment_name_ is None:
            exp_id = self.path.split('/', 2)[1]
            r, s = Experiment().search_by_name_and_project(self.project, exp_id, ['title'])
            if r.hits.total:
                self.experiment_name_ = r[0].title[0]

        return self.experiment_name_

    def to_dict(self, get_id = False, *args, **kwargs):
        d = super(PublicObject, self).to_dict(*args, **kwargs)
        d['projectTitle'] = self.project_title
        d['projectName'] = self.project_name
        d['experimentName'] = self.experiment_name
        if get_id:
            d['_id'] = self._id
        return d

    class Meta:
        index = 'nees'
        doc_type = 'object'



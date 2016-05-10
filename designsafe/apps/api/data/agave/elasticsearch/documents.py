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
import urllib
import six
import re
import os

logger = logging.getLogger(__name__)

es_settings = getattr(settings, 'ELASTIC_SEARCH', {})

try:
    default_index = es_settings['default_index']
    cluster = es_settings['cluster']
    hosts = cluster['hosts']
except KeyError as e:
    logger.exception('ELASTIC_SEARCH missing %s' % e)

connections.configure(
    default={
        'hosts': hosts,
        'sniff_on_start': True,
        'sniff_on_connection_fail': True,
        'sniffer_timeout': 60,
        'retry_on_timeout': True,
        'timeout:': 20,
    })

class Object(DocType):
    source = 'agave'

    @classmethod
    def listing(cls, system, username, file_path):
        q = {"query":{"filtered":{"query":{"bool":{"must":[{"term":{"path._exact":file_path}}, {"term": {"systemId": system}}]}},"filter":{"bool":{"should":[{"term":{"owner":username}},{"terms":{"permissions.username":[username, "world"]}}], "must_not":{"term":{"deleted":"true"}} }}}}}
        s = cls.search()
        s.update_from_dict(q)
        return cls._execute_search(s)

    @classmethod
    def from_file_path(cls, system, username, file_path):
        path, name = os.path.split(file_path)
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
        q = {"query":{"filtered":{"query":{"bool":{"must":[{"term":{"path._path":file_path}}, {"term": {"systemId": system}}]}},"filter":{"bool":{"should":[{"term":{"owner":username}},{"terms":{"permissions.username":[username, "world"]}}], "must_not":{"term":{"deleted":"true"}} }}}}}
        s = cls.search()
        s.update_from_dict(q)
        return cls._execute_search(s)

    @classmethod
    def from_agave_file(cls, username, file_obj):
        o = cls.from_file_path(file_obj.system, username, file_obj.full_path)
        if o is not None:
            return o

        o = cls(
            mimeType = file_obj.mime_type,
            name = file_obj.name,
            format = file_obj.format,
            deleted = False,
            lastModified = file_obj.lastModified.isoformat(),
            fileType = file_obj.ext,
            agavePath = 'agave://{}/{}'.format(file_obj.system, file_obj.full_path),
            systemTags = [],
            length = file_obj.length,
            systemId = file_obj.system,
            path = file_obj.parent_path,
            keywords = [],
            link = file_obj._links['self']['href'],
            type = file_obj.type,
            permissions = file_obj.permissions
        )
        o.save()
        return o

    @staticmethod        
    def _execute_search(s):
        try:
            res = s.execute()
        except TransportError as e:
            if e.status_code == 404:
                raise
            res = s.execute()
        return res, s


    def move(self, username, path):
        if self.type == 'dir':
            res, s = self.__class__.listing_recursive(self.system, username, os.path.join(self.path, self.name))
            for o in s.scan():
                regex = r'^{}'.format(os.path.join(self.path, self.name))
                o.update(path = re.sub(regex, os.path.join(path, self.name), o.path, count = 1))
                o.update(agavePath = 'agave://{}/{}'.format(self.systemId, os.path.join(self.path, self.name))) 

        self.update(path = path)
        self.update(agavePath = 'agave://{}/{}'.format(self.systemId, os.path.join(self.path, self.name)))
        return self

    def copy(self, username, path):
        path = urllib.unquote(path)
        #split path arg. Assuming is in the form /file/to/new_name.txt
        tail, head = os.path.split(path)
        #check if we have something in tail.
        #If we don't then we got just the new file name in the path arg.
        if tail == '':
            head = path
        if self.type == 'dir':
            res, s = self.__class__.listing_recursive(self.system, username, os.path.join(self.path, self.name))
            for o in s.scan():
                d = o.to_dict()
                regex = r'^{}'.format(os.path.join(self.path, self.name))
                d['path'] = re.sub(regex, os.path.join(self.path, head), d['path'], count = 1)
                d['agavePath'] = 'agave://{}/{}'.format(self.systemId, os.path.join(d['path'], d['name']))
                doc = Object(**d)
                doc.save()
        d = self.to_dict()
        d['name'] = head
        d['agavePath'] = 'agave://{}/{}'.format(self.systemId, os.path.join(d['path'], d['name']))
        doc = Object(**d)
        doc.save()
        return self

    def rename(self, username, path):
        path = urllib.unquote(path)
        #split path arg. Assuming is in the form /file/to/new_name.txt
        tail, head = os.path.split(path)
        #check if we have something in tail.
        #If we don't then we got just the new file name in the path arg.
        if tail == '':
            head = path       
        if self.type == 'dir':
            res, s = self.__class__.listing_recursive(self.system, username, os.path.join(self.path, self.name))
            for o in s.scan():
                regex = r'^{}'.format(os.path.join(self.path, self.name))
                o.update(path = re.sub(regex, os.path.join(self.path, head), o.path, count = 1))
                o.update(agavePath = 'agave://{}/{}'.format(self.systemId, os.path.join(self.path, head)))
                logger.debug('Updated document to {}'.format(os.path.join(o.path, o.name)))
        self.update(name = head)
        self.update(agavePath = 'agave://{}/{}'.format(self.systemId, os.path.join(self.path, head)))
        logger.debug('Updated ocument to {}'.format(os.path.join(self.path, self.name)))
        return self
        
    def to_file_dict(self):
        try:
            lm = dateutil.parser.parse(self.lastModified)
        except AttributeError:
            lm = datetime.datetime.now()

        wrap = {
            'format': self.format,
            'lastModified': lm,
            'length': self.length,
            'mimeType': self.mimeType,
            'name': self.name,
            'path': os.path.join(self.path, self.name),
            'permissions': self.permissions,
            'system': self.systemId,
            'type': self.type,
            '_permissions': self.permissions
        }
        f = AgaveFile(wrap = wrap)
        return f.to_dict()

    class Meta:
        index = default_index
        doc_type = 'objects'

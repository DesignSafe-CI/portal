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

    @staticmethod        
    def _execute_search(s):
        try:
            res = s.execute()
        except TransportError as e:
            if e.status_code == 404:
                raise
            res = s.execute()
        return res, s

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

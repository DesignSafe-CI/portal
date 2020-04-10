"""
.. module: portal.libs.elasticsearch.docs.base
   :synopsis: Wrapper classes for ES different doc types.
"""

import logging
from django.conf import settings
from elasticsearch import Elasticsearch

#pylint: disable=invalid-name
logger = logging.getLogger(__name__)
#pylint: enable=invalid-name


def reindex(from_index, from_doc_type, to_index, to_doc_type,
            remote_host=None, script=None, request_timeout=240):
    body = {
        "source": {
            "index": from_index,
            "type": from_doc_type
        },
        "dest": {
            "index": to_index,
            "type": to_doc_type
        }
    }
    if remote_host:
        body['source']['remote'] = {'host': remote_host}

    if script:
        body['script'] = script

    es_local = Elasticsearch(
        settings.ES_CONNECTIONS[settings.DESIGNSAFE_ENVIRONMENT]['hosts'],
        request_timeout=120)
    resp = es_local.reindex(body=body, request_timeout=request_timeout)
    logger.debug(resp)

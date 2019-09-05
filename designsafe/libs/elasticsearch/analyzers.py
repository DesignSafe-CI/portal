"""
.. module: designsafe.libs.elasticsearch.analyzers
   :synopsis: Elastic Search Analyzers
"""
import logging
from elasticsearch_dsl import analyzer, tokenizer

#pylint: disable=invalid-name
logger = logging.getLogger(__name__)
#pylint: enable=invalid-name

path_analyzer = analyzer('path_analyzer',
                         tokenizer=tokenizer('path_hierarchy'))

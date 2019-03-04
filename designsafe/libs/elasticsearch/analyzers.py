"""
.. module: designsafe.libs.elasticsearch.analyzers
   :synopsis: Elastic Search Analyzers
"""
from __future__ import unicode_literals, absolute_import
import logging
from elasticsearch_dsl import analyzer, tokenizer

#pylint: disable=invalid-name
logger = logging.getLogger(__name__)
#pylint: enable=invalid-name

path_analyzer = analyzer('path_analyzer',
                         tokenizer=tokenizer('path_hierarchy'))

name_analyzer = analyzer('file_analyzer',
                         tokenizer=tokenizer('namegram', 'nGram', min_gram=2, max_gram=20),
                         filter='lowercase')

query_analyzer_short = analyzer('file_query_analyzer_short',
                               tokenizer='keyword', filter='lowercase')

query_analyzer_long = analyzer('file_query_analyzer_long',
                               tokenizer=tokenizer('20gram', 'nGram', min_gram=20, max_gram=20), 
                               filter='lowercase')

keyword_analyzer = analyzer('keyword_analyzer',
                        tokenizer=tokenizer('file_pattern', 'pattern', pattern='[\,\;]\s*'),
                        filter='lowercase')

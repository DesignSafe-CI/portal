"""
.. module: designsafe.libs.elasticsearch.analyzers
   :synopsis: Elastic Search Analyzers
"""

import logging
from elasticsearch_dsl import analyzer, tokenizer

# pylint: disable=invalid-name
logger = logging.getLogger(__name__)
# pylint: enable=invalid-name

path_analyzer = analyzer('path_analyzer',
                         tokenizer=tokenizer('path_hierarchy'))

file_analyzer = analyzer('file_analyzer',
                         tokenizer=tokenizer('trigram', 'nGram', min_gram=3, max_gram=3, token_chars=["letter", "digit", "punctuation", "symbol"]),
                         filter='lowercase')

file_pattern_analyzer = analyzer('file_ext_analyzer',
                                 tokenizer=tokenizer('file_pattern', 'pattern', pattern='\\.'),
                                 filter='lowercase')

reverse_file_analyzer = analyzer('file_reverse',
                                 tokenizer=tokenizer('keyword'),
                                 filter=['lowercase', 'reverse'])

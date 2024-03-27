"""
.. module: libs.tapis.serializers
   :synopsis: Serialize a Tapis object into a dict.
"""

import logging
import json
from tapipy.tapis import TapisResult

logger = logging.getLogger(__name__)


class BaseTapisResultSerializer(json.JSONEncoder):
    """Class to serialize a Tapis response object"""

    def _serialize(self, obj):
        if isinstance(obj, TapisResult):
            _wrapped = vars(obj)
            for key, value in _wrapped.items():
                if isinstance(value, TapisResult):
                    _wrapped[key] = self._serialize(value)
                elif isinstance(value, list):
                    for index, item in enumerate(value):
                        value[index] = self._serialize(item)
                elif isinstance(value, dict):
                    for n_key, n_value in value.items():
                        value[n_key] = self._serialize(n_value)
            return _wrapped

        if isinstance(obj, list):
            for index, item in enumerate(obj):
                obj[index] = self._serialize(item)
        elif isinstance(obj, dict):
            for key, value in obj.items():
                obj[key] = self._serialize(value)
        return obj

    def default(self, o):
        if isinstance(o, (TapisResult, list, dict)):
            return self._serialize(o)
        return json.JSONEncoder.encode(self, o)

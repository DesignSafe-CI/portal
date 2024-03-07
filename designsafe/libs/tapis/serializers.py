"""
.. module: libs.tapis.serializers
   :synopsis: Necessary classes to serialize a class which
    wrapps an agave object into a dict.
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
            for k, v in _wrapped.items():
                if isinstance(v, TapisResult):
                    _wrapped[k] = self._serialize(v)
                elif isinstance(v, list):
                    for index, item in enumerate(v):
                        v[index] = self._serialize(item)
                elif isinstance(v, dict):
                    for nk, nv in v.items():
                        v[nk] = self._serialize(nv)
            return _wrapped
        elif isinstance(obj, list):
            for index, item in enumerate(obj):
                obj[index] = self._serialize(item)
        elif isinstance(obj, dict):
            for nk, nv in obj.items():
                obj[nk] = self._serialize(nv)
        return obj

    def default(self, obj):
        if isinstance(obj, (TapisResult, list, dict)):
            return self._serialize(obj)
        return json.JSONEncoder.encode(self, obj)

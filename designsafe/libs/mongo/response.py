"""Mongo HTTP response.

.. module:: designsafe.libs.mongo.response
    :synopsis: Mongo HTTP response classes.
"""
import logging
from bson import json_util
from django.http.response import HttpResponse


LOG = logging.getLogger(__name__)


class MongoJsonResponse(HttpResponse):
    """An HTTP Response class that serializes mongo docs into JSON."""

    def __init__(self, data, **kwargs):
        """Serialize dict with mongo docs.

        :param data: Data to be serialized into json.

        .. note::
            :meth:`bson.json_util.dumps` will be used to serialize data.
        .. note::
            Any extra :param:`kwargs` will be passed to
            :class:`~django.http.response.HttpResponse`.
        .. warning::
            This might be a bit slow. If it is change to
            :class:`~django.http.response.JsonResponse`, e.g.
                ```python
                from bson import json_util
                return JsonResponse(
                    {"response": mongo_doc},
                    json_dumps_params={"default": json_util.default}
                )
                ```
        """
        kwargs.setdefault("content_type", "application/json")
        data = json_util.dumps(data)
        super(MongoJsonResponse, self).__init__(content=data, **kwargs)

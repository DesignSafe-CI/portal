from boxsdk.object.base_object import BaseObject
import json


class BoxObjectJsonSerializer(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, BaseObject):
            return o._response_object
        else:
            return super(BoxObjectJsonSerializer, self).default(o)

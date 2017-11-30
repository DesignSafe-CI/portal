from designsafe.apps.api.agave import to_camel_case
from datetime import datetime


class BaseAgaveResource(object):
    """
    Base Class that all Agave API Resource objects inherit from.
    """

    def __init__(self, agave_client, **kwargs):
        """
        :param agave_client: agavepy.Agave instance this model will use
        """
        self._agave = agave_client
        self._wrapped = kwargs

    def to_dict(self):
        ret = self._wrapped
        if 'lastModified' in ret and isinstance(ret['lastModified'], datetime):
            ret['lastModified'] = ret['lastModified'].isoformat()
        
        return ret

    def __getattr__(self, name):
        # return name from _wrapped; _wrapped expects camelCased keys
        camel_name = to_camel_case(name)
        if camel_name in self._wrapped:
            return self._wrapped.get(camel_name)

        raise AttributeError('\'{0}\' has no attribute \'{1}\''.format(self.__class__.__name__, name))

    def __setattr__(self, name, value):
        if name != '_wrapped' and name != '_agave':
            camel_name = to_camel_case(name)
            if camel_name in self._wrapped:
                self._wrapped[camel_name] = value
                return

        super(BaseAgaveResource, self).__setattr__(name, value)

from agavepy.agave import AgaveException, Agave
from agavepy.async import AgaveAsyncResponse, TimeoutError, Error
from requests.exceptions import HTTPError
from designsafe.apps.api.exceptions import ApiException
import logging
logger = logging.getLogger(__name__)


class AgaveObject(object):
    """
    Main class for agave objects
    """

    def __init__(self, wrap = {}, **kwargs):
        self._wrap = wrap
        self.agave_client = None

    def get_operation(self, a, op):
        o = reduce(getattr, op.split("."), a)
        return o

    def exec_operation(self, op, **kwargs):
        response = op(**kwargs)
        return response

    def call_operation(self, operation, raise_agave = False, **kwargs):
        a = self.agave_client
        op = self.get_operation(a, operation)
        try:
            logger.debug('Agave: calling {}, args: {}'.format(operation, kwargs))
            response = self.exec_operation(op, **kwargs)
        except (AgaveException, HTTPError) as e:
            logger.error(e,
                exc_info = True,
                extra = kwargs)
            if e.response.status_code < 500 or raise_agave:
                raise
            else:
                d = {'operation': op}
                d.update(kwargs)
                raise ApiException(e.message, 
                            e.response.status_code, 
                            extra = d)
            response = None
        return response

    def split_filepath(self, path):
        path = path.strip('/')
        path, name =  os.path.split(path)
        if path == '':
            path = '/'
        return path, name

    def __getattr__(self, name):
        """
        Overwrite so we can access the wrapped dictionary as class properties.
        We have to check if the name is a key in the wrapped dictionary
        because `dict.get` returns `None` if the key doesn't exists. This is not ideal.
        if a non existent attribute is accessed the value returned is `None` instead of
        an AttributeError. If the name is not a key in the wrapped dictionary
        raise an AttributeError exception.
        """
        #check if the string has an underscore. Don't pay attention to the first character
        #we don't care if it starts with an underscore. 
        if name[1:].find('_') > 0:
            #convert from underscore to camelcase
            name = ''.join(l.capitalize() for l in name.split('_'))
            name = name[0].lower() + name[1:]

        if name in self._wrap:
            return self._wrap.get(name)
        else:
            raise AttributeError('\'AgaveObject\' has no attribute \'%s\'' % (name))
    

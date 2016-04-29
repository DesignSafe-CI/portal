from agavepy.agave import AgaveException, Agave
from agavepy.async import AgaveAsyncResponse, TimeoutError, Error
from designsafe.apps.api.exceptions import ApiException
import logging
logger = logging.getLogger(__name__)

class AgaveObject(object):
    """
    Main class for agave objects
    """

    def __init__(self, wrap = {}, **kwargs):
        self._wrap = wrap

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
        except AgaveException as e:
            logger.error('Agave: error:{} - calling {}, args:{} '.format(e.message, operation, kwargs),
                exc_info = True,
                extra = kwargs)
            if e.response.status_code == 404 or raise_agave:
                raise
            else:
                raise HTTPError(e.message)
            response = None
        except KeyError as e:
            if e.message == 'date-time':
                response = None
            else:
                raise
        return response

    def __getattr__(self, name):
        val = self._source.get(name, None)
        if val is None:
            return super(AgaveObject, self).__getattr__(name)

    def split_filepath(self, path):
        path = path.strip('/')
        path, name =  os.path.split(path)
        if path == '':
            path = '/'
        return path, name

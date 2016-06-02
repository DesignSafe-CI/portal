from requests.exceptions import RequestException
from requests.models import Response


class ApiException(RequestException):
    """
    The :class: `ApiException <ApiException>` object.
    Use this to raise custom exceptions. It inherits from `requests.exceptions.RequestException`.
    This class helps to use custom message and status codes as well as an `extra` dictionary object.
    The `extra` dictionary object will be passed into the logger.

    Raising an exception with a message, a status code and some extra information:
    >>> raise ApiException("Exception message", 500, {'username': 'myusername'})

    Raising an exception based on a requests exception
    >>> except HTTPError as e:
    >>>     raise ApiException("New Exception message", request = e.request, response = e.response)

    Args:
        message: Message of exception.
        status: Status code of exception.
        extra: Extra information of exception.

    """
    def __init__(self, message = None, status = None, extra = {}, *args, **kwargs):
        super(ApiException, self).__init__(*args, **kwargs)
        response = self.response or Response()
        response.status_code = status or response.status_code
        response.reason = message or response.reason
        self.message = message or response.reason
        self.response = response
        self.extra = extra

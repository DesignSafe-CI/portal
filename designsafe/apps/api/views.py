from django.http.response import HttpResponse
from django.views.generic import View
from requests.exceptions import ConnectionError, HTTPError
from .exceptions import ApiException
import logging
from logging import getLevelName
import json

logger = logging.getLogger(__name__)


class BaseApiView(View):

    def dispatch(self, request, *args, **kwargs):
        """
        Dispatch override to centralize error handling.
        If the error is instance of :class: `ApiException <designsafe.apps.api.exceptions.ApiException>`.
        An extra dictionary object will be used when calling `logger.error()`. 
        This allows to use any information in the `extra` dictionary object on the 
        logger output as well as the opbeat UI.
        """
        try:
            return super(BaseApiView, self).dispatch(request, *args, **kwargs)
        except ApiException as e:
            status = e.response.status_code
            message = e.response.reason
            extra = e.extra
            logger.error('{}'.format(message),
                exc_info = True,
                extra = extra
                )
        except (ConnectionError, HTTPError) as e:
            status = e.response.status_code
            message = e.response.reason
            logger.error('{}'.format(message),
                exc_info = True,
                extra = {
                    'username': request.user.username
                }
                )
        
        resp = {'message': message}
        if request.FILES:
            resp['files'] = request.FILES
                                      
        return HttpResponse(json.dumps(resp), status = status, content_type = 'application/json')


class LoggerApi(BaseApiView):
    """
    Logger API for capturing logs from the front-end.

    @see ng-designsafe/services/logging-service.js
    """

    def post(self, request):
        """
        Accepts a log message from the front end. Attempts to determine the level at
        which the message should be logged, and the name of the front-end logger. It
        then logs the message JSON as appropriate.

        Args:
            request: {django.http.HttpRequest} the HTTP request

        Returns: HTTP 202

        """
        log_json = request.body.decode('utf-8')
        log_data = json.loads(log_json)
        level = getLevelName(log_data.pop('level', 'INFO'))
        name = log_data.pop('name');

        logger.log(level, '%s: %s', name, json.dumps(log_data), extra={
            'user': request.user.username,
            'referer': request.META.get('HTTP_REFERER')
        })
        return HttpResponse('OK', status=202)



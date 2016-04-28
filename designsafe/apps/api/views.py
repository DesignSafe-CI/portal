from django.http.response import HttpResponse
from django.views.generic import View
import logging
from logging import getLevelName
import json

logger = logging.getLogger(__name__)


class BaseApiView(View):

    def dispatch(self, request, *args, **kwargs):
        return super(BaseApiView, self).dispatch(request, *args, **kwargs)


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

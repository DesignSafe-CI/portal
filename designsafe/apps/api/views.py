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

    def post(self, request):
        log_json = request.body.decode('utf-8')
        log_data = json.loads(log_json)
        level = getLevelName(log_data['level'])
        if not isinstance(level, int):
            level = getLevelName('INFO')
        message = log_data.get('message', None)
        args = log_data.get('args', [])
        logger.log(level, message, *args, extra={
            'user': request.user.username,
            'referer': request.META.get('HTTP_REFERER')
        })
        return HttpResponse('OK', status=202)

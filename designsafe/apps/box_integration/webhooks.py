from django.http.response import HttpResponse
from django.views.decorators.csrf import csrf_exempt
import logging


logger = logging.getLogger(__name__)


@csrf_exempt
def box_webhook(request):
    if request.method == 'POST':
        logger.debug(request.body)
    return HttpResponse('OK')

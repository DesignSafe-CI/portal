# from agavepy.agave import AgaveException
import logging

from django.shortcuts import render

logger = logging.getLogger(__name__)


def index(request):
    logger.debug('search index')
    return render(request, 'designsafe/apps/search/index.html')

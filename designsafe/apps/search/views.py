from django.shortcuts import render


import logging


logger = logging.getLogger(__name__)


def index(request):
    logger.debug('search index')
    return render(request, 'designsafe/apps/search/index.html')
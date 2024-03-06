from django.core import serializers
from django.http import HttpResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
# from agavepy.agave import AgaveException
from requests import HTTPError
from django.contrib.auth import get_user_model

from itertools import chain

import json
import logging


logger = logging.getLogger(__name__)


def index(request):
    logger.debug('search index')
    return render(request, 'designsafe/apps/search/index.html')

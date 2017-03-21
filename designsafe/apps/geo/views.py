from django.core import serializers
from django.http import HttpResponse
from django.shortcuts import render
from requests import HTTPError
from django.contrib.auth import get_user_model


import json
import logging


logger = logging.getLogger(__name__)


def index(request):
    return render(request, 'designsafe/apps/geo/index.html')

def test(request):
    return render(request, 'designsafe/apps/geo/test.html')

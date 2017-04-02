from django.core import serializers
from django.http import HttpResponse
from django.shortcuts import render
from requests import HTTPError
from django.contrib.auth import get_user_model
from django.contrib.auth.decorators import login_required



import json
import logging


logger = logging.getLogger(__name__)

@login_required
def index(request):
    return render(request, 'designsafe/apps/geo/index.html')

@login_required
def test(request):
    return render(request, 'designsafe/apps/geo/test.html')

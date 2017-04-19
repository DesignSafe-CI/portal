from django.core import serializers
from django.http import HttpResponse, JsonResponse
from django.shortcuts import render
from requests import HTTPError
from django.contrib.auth import get_user_model
from django.contrib.auth.decorators import login_required
import json
import logging
from designsafe.apps.rapid.models import RapidNHEventType, RapidNHEvent


logger = logging.getLogger(__name__)

@login_required
def index(request):
    return render(request, 'designsafe/apps/rapid/index.html')

def get_event_types(request):
    s = RapidNHEventType.search()
    results  = s.execute()
    out = [h.to_dict() for h in results.hits]
    return JsonResponse(out, safe=False)

def get_events(request):
    s = RapidNHEvent.search()
    results = s.execute()
    out = [h.to_dict() for h in results.hits]
    return JsonResponse(out, safe=False)

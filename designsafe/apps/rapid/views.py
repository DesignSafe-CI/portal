import uuid
import os
from django.core.urlresolvers import reverse
from django.http import HttpResponse, JsonResponse, HttpResponseRedirect, HttpResponseNotFound
from django.shortcuts import render
from requests import HTTPError
from django.contrib.auth.decorators import login_required
import json
import logging
from designsafe.apps.rapid.models import RapidNHEventType, RapidNHEvent
from designsafe.apps.rapid import forms as rapid_forms

logger = logging.getLogger(__name__)

from designsafe import settings


def handle_uploaded_file(f):
    file_id = str(uuid.uuid1())
    with open(os.path.join(settings.RAPID_UPLOAD_PATH, 'images', file_id), 'wb+') as destination:
        for chunk in f.chunks():
            destination.write(chunk)

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


@login_required
def admin(request):
    s = RapidNHEvent.search()
    results = s.execute()
    logger.info(results)
    context = {}
    context["rapid_events"] = results
    return render(request, 'designsafe/apps/rapid/admin.html', context)

@login_required
def admin_create_event(request):
    form = rapid_forms.RapidNHEventForm(request.POST or None)
    logger.info(form.fields["event_type"])
    q = RapidNHEventType.search()
    event_types = q.execute()
    options = [(et.name, et.display_name) for et in event_types]
    form.fields["event_type"].choices = options
    if request.method == 'POST':
        if form.is_valid():
            logger.info(form.cleaned_data)
            ev = RapidNHEvent()
            ev.location_description = form.cleaned_data["location_description"]
            ev.location = {"lat": form.cleaned_data["lat"], "lon":form.cleaned_data["lon"]}
            ev.date = form.cleaned_data["event_date"]
            ev.event_type = form.cleaned_data["event_type"]
            ev.title = form.cleaned_data["title"]
            if form.cleaned_data["image"]:
                logger.info(form.cleaned_data["image"])
            ev.save(refresh=True)
            return HttpResponseRedirect(reverse('designsafe_rapid:admin'))
        else:
            context = {}
            context["form"] = form
            return render(request, 'designsafe/apps/rapid/admin_create_event.html', context)
    else:
        context = {}
        context["form"] = form
        return render(request, 'designsafe/apps/rapid/admin_create_event.html', context)

@login_required
def admin_edit_event(request, event_id):
    try:
        event = RapidNHEvent.get(event_id)
    except:
        return HttpResponseNotFound()
    logger.info(event.to_dict())
    logger.info(event.location.lon)
    data = event.to_dict()
    data["lat"] = event.location.lat
    data["lon"] = event.location.lon
    form = rapid_forms.RapidNHEventForm(request.POST or data)
    q = RapidNHEventType.search()
    event_types = q.execute()
    options = [(et.name, et.display_name) for et in event_types]
    form.fields["event_type"].choices = options
    form.fields['lat'].initial = event.location["lat"]
    form.fields['lon'].initial = event.location["lon"]
    if request.method == 'POST':
        if form.is_valid():
            logger.info(form.cleaned_data)
            ev = RapidNHEvent(**form.cleaned_data)
            # need to do something with the actual file in the uploads directory
            # if it was changed. Delete it or else it will persist forever.
            ev.save(refresh=True)
            return HttpResponseRedirect(reverse('designsafe_rapid:admin'))
        else:
            context = {}
            context["form"] = form
            return render(request, 'designsafe/apps/rapid/admin_create_event.html', context)
    else:
        context = {}
        context["form"] = form
        context["event"] = event
        return render(request, 'designsafe/apps/rapid/admin_edit_event.html', context)

@login_required
def admin_event_add_dataset(request, event_id):
    try:
        event = RapidNHEvent.get(event_id)
    except:
        return HttpResponseNotFound()

    form = rapid_forms.RapidNHEventDatasetForm(request.POST or None)

    if request.method == 'POST':
        if form.is_valid():
            logger.info(form.cleaned_data)
            event.datasets.append(form.cleaned_data)
            return HttpResponseRedirect(reverse('designsafe_rapid:admin'))
    else:
        context = {}
        context["event"] = event
        context["form"] = form
        return render(request, 'designsafe/apps/rapid/admin_event_add_dataset.html', context)

@login_required
def admin_event_edit_dataset(request, event_id, dataset_id):
    try:
        event = RapidNHEvent.get(event_id)
    except:
        return HttpResponseNotFound()

    form = rapid_forms.RapidNHEventDatasetForm(request.post or None)

    if request.method == 'POST':
        if form.is_valid():
            logger.info(form.cleaned_data)
            return HttpResponseRedirect(reverse('designsafe_rapid:admin'))

    else:
        context = {}
        context["event"] = event
        context["form"] = form
        return render(request, 'designsafe/apps/rapid/admin_event_edit_dataset.html', context)

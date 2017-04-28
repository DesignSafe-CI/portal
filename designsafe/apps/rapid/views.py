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
    if request.method == 'POST':
        form = rapid_forms.RapidNHEventForm(request.POST)
        if form.is_valid():
            logger.info(form.cleaned_data)
            ev = RapidNHEvent(**form.cleaned_data)
            ev.save()
            return HttpResponseRedirect(reverse('designsafe_rapid:admin'))
        else:
            context = {}
            context["form"] = form
            return render(request, 'designsafe/apps/rapid/admin_create_event.html', context)
    else:
        form = rapid_forms.RapidNHEventForm()
        context = {}
        context["form"] = form
        return render(request, 'designsafe/apps/rapid/admin_create_event.html', context)

@login_required
def admin_edit_event(request, event_id):
    if request.method == 'POST':
        form = rapid_forms.RapidNHEventForm(request.POST)
        try:
            event = RapidNHEvent.get(event_id)
        except:
            return HttpResponseNotFound()
        if form.is_valid():
            logger.info(form.cleaned_data)
            ev = RapidNHEvent(**form.cleaned_data)
            ev.save()
            return HttpResponseRedirect(reverse('designsafe_rapid:admin'))
        else:
            context = {}
            context["form"] = form
            return render(request, 'designsafe/apps/rapid/admin_create_event.html', context)
    else:
        try:
            event = RapidNHEvent.get(event_id)
        except:
            return HttpResponseNotFound()
        form = rapid_forms.RapidNHEventForm(initial=event.to_dict())

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
    form = rapid_forms.RapidNHEventDatasetForm()
    context = {}
    context["event"] = event
    context["form"] = form
    return render(request, 'designsafe/apps/rapid/admin_event_add_dataset.html', context)

import uuid
import os
import json
import StringIO
from datetime import datetime
from PIL import Image
from django.core.urlresolvers import reverse
from django.http import JsonResponse, HttpResponseRedirect, HttpResponseNotFound, HttpResponseBadRequest
from django.shortcuts import render
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib.auth import get_user_model, models
from django.db.models import Q

import logging
from designsafe.apps.rapid.models import RapidNHEventType, RapidNHEvent
from designsafe.apps.rapid import forms as rapid_forms

logger = logging.getLogger(__name__)
metrics_logger = logging.getLogger('metrics')

from designsafe import settings

def thumbnail_image(fobj, size=(400, 400)):
    im = Image.open(fobj)
    im.thumbnail( (400, 400), Image.ANTIALIAS)
    file_buffer = StringIO.StringIO()
    im.save(file_buffer, format='JPEG')
    return file_buffer


def handle_uploaded_image(f, file_id):
    with open(os.path.join(settings.DESIGNSAFE_UPLOAD_PATH, 'RAPID', 'images', file_id), 'wb+') as destination:
        destination.write(f.getvalue())


def rapid_admin_check(user):
    return user.groups.filter(name="Rapid Admin").exists()


def index(request):
    metrics_logger.info('Rapid Index',
                 extra = {
                     'user': request.user.username,
                     'sessionId': getattr(request.session, 'session_key', ''),
                     'operation': 'rapid_index_view'
                 })
    return render(request, 'designsafe/apps/rapid/index.html')


def get_event_types(request):
    s = RapidNHEventType.search()
    results  = s.execute(ignore_cache=True)
    out = [h.to_dict() for h in results.hits]
    return JsonResponse(out, safe=False)


def get_events(request):
    s = RapidNHEvent.search()
    results = s.execute(ignore_cache=True)
    out = [h.to_dict() for h in results.hits]
    return JsonResponse(out, safe=False)


@user_passes_test(rapid_admin_check)
@login_required
def admin(request):
    s = RapidNHEvent.search()
    results = s.execute(ignore_cache=True)
    context = {}
    context["rapid_events"] = results
    return render(request, 'designsafe/apps/rapid/admin.html', context)


@user_passes_test(rapid_admin_check)
@login_required
def admin_create_event(request):
    form = rapid_forms.RapidNHEventForm(request.POST or None, request.FILES or None)
    q = RapidNHEventType.search()
    event_types = q.execute(ignore_cache=True)
    options = [(et.name, et.display_name) for et in event_types]
    form.fields["event_type"].choices = options
    if request.method == 'POST':
        if form.is_valid():
            ev = RapidNHEvent()
            ev.location_description = form.cleaned_data["location_description"]
            ev.location = {
                "lat": form.cleaned_data["lat"],
                "lon":form.cleaned_data["lon"]
            }
            ev.event_date = form.cleaned_data["event_date"]
            ev.event_type = form.cleaned_data["event_type"]
            ev.title = form.cleaned_data["title"]
            ev.created_date = datetime.utcnow()
            if request.FILES:
                try:
                    image_uuid = str(uuid.uuid1())
                    f = request.FILES["image"]
                    thumb = thumbnail_image(f)
                    handle_uploaded_image(thumb, image_uuid)
                    ev.main_image_uuid = image_uuid
                except:
                    return HttpResponseBadRequest("Hmm, a bad file perhaps?")
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


@user_passes_test(rapid_admin_check)
@login_required
def admin_edit_event(request, event_id):
    try:
        event = RapidNHEvent.get(event_id)
    except:
        return HttpResponseNotFound()
    data = event.to_dict()
    data["lat"] = event.location.lat
    data["lon"] = event.location.lon
    form = rapid_forms.RapidNHEventForm(request.POST or data, request.FILES or None)
    q = RapidNHEventType.search()
    event_types = q.execute()
    options = [(et.name, et.display_name) for et in event_types]
    form.fields["event_type"].choices = options
    form.fields['lat'].initial = event.location["lat"]
    form.fields['lon'].initial = event.location["lon"]
    if request.method == 'POST':
        if form.is_valid():
            event.event_date = form.cleaned_data["event_date"]
            event.location = {
                "lat": form.cleaned_data["lat"],
                "lon": form.cleaned_data["lon"]
            }
            event.title = form.cleaned_data["title"]
            event.location_description = form.cleaned_data["location_description"]
            event.event_type = form.cleaned_data["event_type"]
            if request.FILES:
                old_image_uuid = event.main_image_uuid
                try:
                    image_uuid = str(uuid.uuid1())
                    f = request.FILES["image"]
                    thumb = thumbnail_image(f)
                    handle_uploaded_image(thumb, image_uuid)
                    event.main_image_uuid = image_uuid
                except:
                    return HttpResponseBadRequest("Hmm, a bad file perhaps?")
                os.remove(os.path.join(settings.DESIGNSAFE_UPLOAD_PATH, 'RAPID', 'images', old_image_uuid))
            event.save(refresh=True)
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


@user_passes_test(rapid_admin_check)
@login_required
def admin_delete_event(request, event_id):
    try:
        event = RapidNHEvent.get(event_id)
    except:
        return HttpResponseNotFound()
    if request.method == 'POST':
        image_uuid = event.main_image_uuid
        try:
            os.remove(os.path.join(settings.DESIGNSAFE_UPLOAD_PATH, 'RAPID', 'images', image_uuid))
        except:
            pass
        event.delete(refresh=True)
        return HttpResponseRedirect(reverse('designsafe_rapid:admin'))


@user_passes_test(rapid_admin_check)
@login_required
def admin_event_datasets(request, event_id):
    try:
        event = RapidNHEvent.get(event_id)
    except:
        return HttpResponseNotFound()

    context = {
        "event": event
    }
    return render(request, 'designsafe/apps/rapid/admin_event_datasets.html', context)


@user_passes_test(rapid_admin_check)
@login_required
def admin_event_add_dataset(request, event_id):
    try:
        event = RapidNHEvent.get(event_id)
    except:
        return HttpResponseNotFound()

    form = rapid_forms.RapidNHEventDatasetForm(request.POST or None)

    if request.method == 'POST':
        if form.is_valid():
            data = form.cleaned_data
            data["id"] = str(uuid.uuid1())
            event.datasets.append(data)
            event.save(refresh=True)
            return HttpResponseRedirect(reverse('designsafe_rapid:admin'))
    else:
        context = {}
        context["event"] = event
        context["form"] = form
        return render(request, 'designsafe/apps/rapid/admin_event_add_dataset.html', context)


@user_passes_test(rapid_admin_check)
@login_required
def admin_event_edit_dataset(request, event_id, dataset_id):
    try:
        event = RapidNHEvent.get(event_id)
    except:
        return HttpResponseNotFound()

    dataset = next((d for d in event.datasets if d.id == dataset_id), None)
    if not dataset:
        return HttpResponseNotFound()

    form = rapid_forms.RapidNHEventDatasetForm(request.POST or dataset.to_dict())

    if request.method == 'POST':
        if form.is_valid():
            dataset["doi"] = form.cleaned_data["doi"]
            dataset["title"] = form.cleaned_data["title"]
            dataset["url"] = form.cleaned_data["url"]

            event.datasets = [d for d in event.datasets if d["id"] != dataset["id"]]
            event.datasets.append(dataset)
            event.save(refresh=True)
            return HttpResponseRedirect(reverse('designsafe_rapid:admin'))

    else:
        context = {}
        context["event"] = event
        context["form"] = form
        return render(request, 'designsafe/apps/rapid/admin_event_edit_dataset.html', context)


@user_passes_test(rapid_admin_check)
@login_required
def admin_event_delete_dataset(request, event_id, dataset_id):
    try:
        event = RapidNHEvent.get(event_id)
    except:
        return HttpResponseNotFound()
    if request.method == 'POST':
        event.datasets = [ds for ds in event.datasets if ds.id != dataset_id]
        event.save(refresh=True)
        return HttpResponseRedirect(reverse('designsafe_rapid:admin'))


@user_passes_test(rapid_admin_check)
@login_required
def admin_users(request):
    return render(request, 'designsafe/apps/rapid/index.html')


@user_passes_test(rapid_admin_check)
@login_required
def admin_user_permissions(request):
    """
        Request payload must be
        {
            username: 'bob'
            action: 'grant' //or 'revoke'
        }

    """
    if request.method=='POST':
        payload = json.loads(request.body.decode("utf-8"))
        logger.info(payload)
        username = payload["username"]
        action = payload["action"]

        user = get_user_model().objects.get(username=username)
        logger.info(user)
        if not user:
            return HttpResponseNotFound()
        if action == "grant":
            g = models.Group.objects.get(name='Rapid Admin')
            user.groups.add(g)
            user.save()
            return JsonResponse("ok", safe=False)
        elif action == "revoke":
            g = models.Group.objects.get(name='Rapid Admin')
            user.groups.remove(g)
            user.save()
            return JsonResponse("ok", safe=False)
        else:
            return HttpResponseBadRequest()

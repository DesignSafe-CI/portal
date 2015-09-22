from django.conf import settings
from django.contrib import messages
from django.core.mail import send_mail
from django.http import HttpResponseRedirect
from django.utils.html import strip_tags
from .forms import MeetingRequestForm

import logging
import json


logger = logging.getLogger(__name__)

def meeting_request(request):
    if request.POST:
        logger.debug(request.POST)
        sender = settings.DEFAULT_FROM_EMAIL
        recipients = settings.MEETING_REQUEST_EMAIL.split(',')

        data = request.POST.copy()
        email_body = """
        <dl>
        <dt>Organizer</dt>
        <dd>%s</dd>

        <dt>Organizer email</dt>
        <dd>%s</dd>

        <dt>Meeting topic</dt>
        <dd>%s</dd>

        <dt>Meeting date</dt>
        <dd>%s</dd>

        <dt>Meeting start time</dt>
        <dd>%s</dd>

        <dt>Meeting end time</dt>
        <dd>%s</dd>

        <dt>Time zone</dt>
        <dd>%s</dd>

        <dt>Recurrence?</dt>
        <dd>%s</dd>
        </dl>
        """ % (data.get('organizer_name'), data.get('organizer_email'),
               data.get('meeting_topic'), data.get('meeting_date'),
               data.get('meeting_start'), data.get('meeting_end'),
               data.get('meeting_time_zone'), data.get('recurrence'),
            )

        send_mail('[DesignSafe-CI] Meeting Request', strip_tags(email_body), sender, recipients, html_message=email_body)
        messages.success(request, 'Your meeting request has been received! You will be contacted shortly with your meeting details.')


    redirect = request.META['HTTP_REFERER'] or '/'
    return HttpResponseRedirect(redirect)

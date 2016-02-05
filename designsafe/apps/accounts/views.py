from django.shortcuts import render
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.http import HttpResponse, HttpResponseBadRequest, HttpResponseRedirect
from designsafe.apps.accounts import forms
from designsafe.apps.notifications.models import Notification, JobNotification
from pytas.http import TASClient
from pytas.models import User as TASUser
import logging
import json

logger = logging.getLogger(__name__)

@login_required
def index(request):
    """
    The default accounts view. Provides user settings for managing profile,
    authentication, notifications, identities, and applications.
    """
    profile = TASUser(username=request.user.username)
    context = {'profile': profile}
    return render(request, 'designsafe/apps/accounts/index.html', context)

def register(request):
    if request.user.is_authenticated():
        messages.info(request, 'You are already logged in!')
        return HttpResponseRedirect('/')

    if request.method == 'POST':
        account_form = forms.UserRegistrationForm(request.POST)
        if account_form.is_valid():
            try:
                account_form.save()
                messages.success(request, 'Congratulations! Your account request has '
                    'been received. Please check your email for account verification.')
                return HttpResponseRedirect('/')
            except Exception as e:
                logger.exception('Error saving user!')

                error_type = e.args[1] if len(e.args) > 1 else ''

                if 'DuplicateLoginException' in error_type:
                    err_msg = ('The username you chose has already been taken. Please '
                        'choose another. If you already have an account with TACC, '
                        'please log in using those credentials.')
                    account_form._errors.setdefault('username', [err_msg])
                elif 'DuplicateEmailException' in error_type:
                    err_msg = ('This email is already registered. If you already have an '
                        'account with TACC, please log in using those credentials.')
                    account_form._errors.setdefault('email', [err_msg])
                    err_msg = '%s <a href="%s">Did you forget your password?</a>' % (
                        err_msg,
                        reverse('designsafe_accounts:password_reset'))
                elif 'PasswordInvalidException' in error_type:
                    err_msg = ('The password you provided did not meet the complexity '
                        'requirements.')
                    account_form._errors.setdefault('password', [err_msg])
                else:
                    err_msg = ('An unexpected error occurred. If this problem persists '
                        'please create a support ticket.')

                messages.error(request, err_msg)
    else:
        account_form = forms.UserRegistrationForm()

    context = {
        'account_form': account_form
    }
    return render(request, 'designsafe/apps/accounts/register.html', context)

def departments_json(request):
    institutionId = request.GET.get('institutionId')
    if institutionId:
        tas = TASClient()
        departments = tas.get_departments(institutionId)
    else:
        departments = {}
    return HttpResponse(json.dumps(departments), content_type='application/json')

def notifications(request):
    # notification_objects = Notification.objects.filter(deleted=False)
    jobnotifications=JobNotification.objects.filter(deleted=False, user=str(request.user)).order_by('-notification_time')
    job_events = []
    unread = 0
    for notification in jobnotifications:
        job_events.append({
            'jobName': notification.job_name,
            'jobId': notification.job_id,
            'user': notification.user,
            'event': notification.event,
            'read': notification.read,
            'notification_time': notification.notification_time,
            'id': notification.id
            })
        if not notification.read:
            unread += 1
            notification.read = True
            notification.save()

    notifications={}
    notifications['job'] = job_events
    notifications['unread'] = unread
    return render(request, 'designsafe/apps/accounts/notifications.html',
        {'notifications': notifications})

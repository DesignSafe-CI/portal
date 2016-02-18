from django.shortcuts import render, redirect
from django.contrib import messages
from django.contrib.auth.decorators import login_required

from django.core.urlresolvers import reverse
from django.http import HttpResponse, HttpResponseRedirect
from designsafe.apps.accounts import forms, integrations
from designsafe.apps.notifications.models import Notification

from pytas.http import TASClient
from pytas.models import User as TASUser
import logging
import json

logger = logging.getLogger(__name__)


def index(request):
    return HttpResponseRedirect(reverse('designsafe_accounts:manage_profile'))


@login_required
def manage_profile(request):
    """
    The default accounts view. Provides user settings for managing profile,
    authentication, notifications, identities, and applications.
    """
    user_profile = TASUser(username=request.user.username)
    context = {
        'title': 'Manage Profile',
        'profile': user_profile
    }
    return render(request, 'designsafe/apps/accounts/profile.html', context)


@login_required
def manage_authentication(request):
    context = {
        'title': 'Authentication Settings',
    }
    return render(request, 'designsafe/apps/accounts/manage_auth.html', context)


@login_required
def manage_identities(request):
    context = {
        'title': 'Manage Identities',
    }
    return render(request, 'designsafe/apps/accounts/manage_identities.html', context)


@login_required
def manage_notifications(request):
    context = {
        'title': 'Notification Settings',
    }
    return render(request, 'designsafe/apps/accounts/manage_notifications.html', context)


@login_required
def manage_applications(request):
    context = {
        'title': 'Manage Applications',
        'integrations': integrations.get_integrations()
    }
    return render(request, 'designsafe/apps/accounts/manage_applications.html', context)


@login_required
def notifications(request):
    items = Notification.objects.filter(
        deleted=False, user=str(request.user)).order_by('-notification_time')
    unread = 0
    for i in items:
        if not i.read:
            unread += 1
            i.mark_read()

    return render(request, 'designsafe/apps/accounts/notifications.html',
                  {
                      'notifications': items,
                      'unread': unread
                  })

def delete_notification(request):
    if request.POST.get('delete') == 'delete':
        Notification.objects.get(id=request.POST.get('id')).delete()
        return redirect('/account/notifications/')

def register(request):
    if request.user.is_authenticated():
        messages.info(request, 'You are already logged in!')
        return HttpResponseRedirect('/')

    if request.method == 'POST':
        account_form = forms.UserRegistrationForm(request.POST)
        if account_form.is_valid():
            try:
                account_form.save()
                messages.success(
                    request,
                    'Congratulations! Your account request has been received. Please '
                    'check your email for account verification.'
                )
                return HttpResponseRedirect('/')
            except Exception as e:
                logger.exception('Error saving user!')

                error_type = e.args[1] if len(e.args) > 1 else ''

                if 'DuplicateLoginException' in error_type:
                    err_msg = (
                        'The username you chose has already been taken. Please '
                        'choose another. If you already have an account with TACC, '
                        'please log in using those credentials.')
                    account_form._errors.setdefault('username', [err_msg])
                elif 'DuplicateEmailException' in error_type:
                    err_msg = (
                        'This email is already registered. If you already have an '
                        'account with TACC, please log in using those credentials.')
                    account_form._errors.setdefault('email', [err_msg])
                    err_msg = '%s <a href="%s">Did you forget your password?</a>' % (
                        err_msg,
                        reverse('designsafe_accounts:password_reset'))
                elif 'PasswordInvalidException' in error_type:
                    err_msg = (
                        'The password you provided did not meet the complexity '
                        'requirements.')
                    account_form._errors.setdefault('password', [err_msg])
                else:
                    err_msg = (
                        'An unexpected error occurred. If this problem persists '
                        'please create a support ticket.')

                messages.error(request, err_msg)
    else:
        account_form = forms.UserRegistrationForm()

    context = {
        'account_form': account_form
    }
    return render(request, 'designsafe/apps/accounts/register.html', context)


def departments_json(request):
    institution_id = request.GET.get('institutionId')
    if institution_id:
        tas = TASClient()
        departments = tas.get_departments(institution_id)
    else:
        departments = {}
    return HttpResponse(json.dumps(departments), content_type='application/json')

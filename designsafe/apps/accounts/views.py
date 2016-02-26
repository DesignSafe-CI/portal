from django.shortcuts import render, redirect
from django.contrib import messages
from django.contrib.auth.decorators import login_required

from django.core.serializers.json import DjangoJSONEncoder
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


# @login_required
# def notifications(request):
#     items = Notification.objects.filter(
#         deleted=False, user=str(request.user)).order_by('-notification_time')
#     unread = 0
#     for i in items:
#         if not i.read:
#             unread += 1
#             i.mark_read()

#     try:
#         items = json.dumps(items, cls=DjangoJSONEncoder)
#     except TypeError as e:
#         items=[]
#     return HttpResponse(items, content_type='application/json')

#     return render(request, 'designsafe/apps/accounts/notifications.html',
#                   {
#                       'notifications': items,
#                       'unread': unread
#                   })

# def delete_notification(request):
#     if request.POST.get('delete') == 'delete':
#         Notification.objects.get(id=request.POST.get('id')).delete()
#         return redirect('/account/notifications/')

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
                logger.info('error: {}'.format(e))

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


def password_reset(request):
    if request.user is not None and request.user.is_authenticated():
        return HttpResponseRedirect(reverse('designsafe_accounts:manage_profile'))

    if request.POST:
        if 'code' in request.GET:
            form = forms.PasswordResetConfirmForm(request.POST)
            if _process_password_reset_confirm(request, form):
                messages.success(request, 'Your password has been reset! You can now log in using your new password')
                return HttpResponseRedirect(reverse('designsafe_accounts:manage_profile'))
        else:
            form = forms.PasswordResetRequestForm(request.POST)
            if _process_password_reset_request(request, form):
                form = forms.PasswordResetRequestForm()

    elif 'code' in request.GET:
        form = forms.PasswordResetConfirmForm(initial={ 'code': request.GET['code'] })
        form.fields['code'].widget = forms.HiddenInput()
    else:
        form = forms.PasswordResetRequestForm()

    if 'code' in request.GET:
        message = 'Confirm your password reset using the form below. Enter your TACC username and new password to complete the password reset process.'
    else:
        message = 'Enter your TACC username to request a password reset. If your account is found, you will receive an email at the registered email address with instructions to complete the password reset.'

    return render(request, 'designsafe/apps/accounts/password_reset.html', { 'message': message, 'form': form })

def _process_password_reset_request(request, form):
    if form.is_valid():
        # always show success to prevent data leaks
        messages.success(request, 'Your request has been received. If an account matching the username you provided is found, you will receive an email with further instructions to complete the password reset process.')

        username = form.cleaned_data['username']
        logger.info('Password reset request for username: "%s"', username)
        try:
            tas = TASClient()
            user = tas.get_user(username=username)
            resp = tas.request_password_reset(user['username'], source='DesignSafe')
            logger.debug(resp)
        except:
            logger.exception('Failed password reset request')

        return True
    else:
        return False

def _process_password_reset_confirm(request, form):
    if form.is_valid():
        data = form.cleaned_data
        try:
            tas = TASClient()
            return tas.confirm_password_reset(data['username'], data['code'], data['password'], source='DesignSafe')
        except Exception as e:
            logger.exception('Password reset failed')
            if len(e.args) > 1:
                if re.search('account does not match', e.args[1]):
                    form.add_error('username', e.args[1])
                elif re.search('No password reset request matches', e.args[1]):
                    form.add_error('code', e.args[1])
                elif re.search('complexity requirements', e.args[1]):
                    form.add_error('password', e.args[1])
                elif re.search('expired', e.args[1]):
                    form.add_error('code', e.args[1])
                else:
                    form.add_error('__all__', 'An unexpected error occurred. Please try again')
            else:
                form.add_error('__all__', 'An unexpected error occurred. Please try again')

    return False

def email_confirmation(request):
    context = {}
    if request.method == 'POST':
        form = forms.EmailConfirmationForm(request.POST)
        if form.is_valid():
            code = request.POST['code']
            username = request.POST['username']
            try:
                tas = TASClient()
                user = tas.get_user(username=username)
                tas.verify_user(user['id'], code)
                activate_local_user(username)
                messages.success(request, 'Congratulations, your email has been verified! Please log in now.')
                return HttpResponseRedirect(reverse('designsafe_accounts:manage_profile'))
            except Exception as e:
                logger.exception('Email verification failed')
                if e[0] == 'User not found':
                    form.add_error('username', e[1])
                else:
                    form.add_error('code', 'Email verification failed. Please check your verification code and username and try again.')

    else:
        form = EmailConfirmationForm(initial={'code': request.GET.get('code', '')})

    context['form'] = form

    return render(request, 'designsafe/apps/accounts/email_confirmation.html', context)


def departments_json(request):
    institution_id = request.GET.get('institutionId')
    if institution_id:
        tas = TASClient()
        departments = tas.get_departments(institution_id)
    else:
        departments = {}
    return HttpResponse(json.dumps(departments), content_type='application/json')

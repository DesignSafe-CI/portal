from django.shortcuts import render
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.core.exceptions import ObjectDoesNotExist
from designsafe.apps.auth.models import DsUser
from django.contrib.auth import get_user_model
from django.core.urlresolvers import reverse
from django.http import HttpResponse, HttpResponseRedirect
from designsafe.apps.accounts import forms, integrations
from designsafe.apps.accounts.models import NEESUser

from pytas.http import TASClient
from pytas.models import User as TASUser

import logging
import json
import re

logger = logging.getLogger(__name__)


def index(request):
    return HttpResponseRedirect(reverse('designsafe_accounts:manage_profile'))


@login_required
def manage_profile(request):
    """
    The default accounts view. Provides user settings for managing profile,
    authentication, notifications, identities, and applications.
    """
    UserModel = get_user_model()
    django_user = UserModel.objects.get(username=request.user.username)
    user_profile = TASUser(username=request.user.username)

    demographics={}
    try:
        demographics['ethnicity'] = django_user.profile.ethnicity
        demographics['gender'] = django_user.profile.gender

    except ObjectDoesNotExist as e:
        logger.info('exception e:{} {}'.format(type(e), e))
        # pass #account was not created through designsafe
    context = {
        'title': 'Manage Profile',
        'profile': user_profile,
        'demographics': demographics
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


def nees_migration(request, step=None):

    if step == 0 or step is None:
        return render(request, 'designsafe/apps/accounts/nees_migration.html',
                      {'form': forms.NEESAccountMigrationForm()})

    elif step == '1':
        if request.method == 'POST':
            email_address = request.POST.get('email_address')
        else:
            email_address = request.GET.get('email_address')
        if email_address:
            nees_user_match = NEESUser.lookup_user(email_address)
            if len(nees_user_match) == 0:
                messages.error(request,
                               'We were unable to locate a NEEShub account for the email '
                               'address <b>%s</b>. Please confirm that you entered the '
                               'email address correctly and try again. If you feel this '
                               'is in error, please submit a support ticket.' %
                               email_address)
                return HttpResponseRedirect(reverse('designsafe_accounts:nees_migration'))
            else:
                tas_by_username = None
                tas_by_email = None
                # check for existing TAS user
                tas_api = TASClient()
                try:
                    tas_by_username = tas_api.get_user(username=nees_user_match[0].username)
                except:
                    logger.exception('Error checking for existing TAS users')
                try:
                    tas_by_email = tas_api.get_user(email=nees_user_match[0].email)
                except:
                    logger.exception('Error checking for existing TAS users')

                context = {
                    'email_address': email_address,
                    'nees_user_match': nees_user_match,
                    'tas_by_username': tas_by_username,
                    'tas_by_email': tas_by_email,
                }
                return render(request,
                              'designsafe/apps/accounts/nees_migration_step_1.html',
                              context)

    elif step == '2':
        tas_api = TASClient()
        if request.method == 'POST':
            email_address = request.POST.get('email_address')
            nees_user_match = NEESUser.lookup_user(email_address)
            countries = tas_api.countries()
            country_residence = next((c for c in countries if c['abbrev'] == nees_user_match[0].countryresident), {'id':None})
            country_origin = next((c for c in countries if c['abbrev'] == nees_user_match[0].countryorigin), {'id':None})
            initial_data = {
                'firstName': nees_user_match[0].givenName,
                'lastName': nees_user_match[0].surname,
                'email': nees_user_match[0].email,
                'phone': nees_user_match[0].phone,
                'countryId': country_residence['id'],
                'citizenshipId': country_origin['id'],
                'username': nees_user_match[0].username,
            }
            if nees_user_match[0].organization is not None:
                initial_data['institutionId'] = -1
                initial_data['institution'] = nees_user_match[0].organization
            form = forms.UserRegistrationForm(initial=initial_data)
            return render(request,
                          'designsafe/apps/accounts/nees_migration_step_2.html',
                          {'form': form})

    elif step == '3':
        # final step!
        tas_api = TASClient()
        if request.method == 'POST':
            form = forms.UserRegistrationForm(request.POST)
            if form.is_valid():
                # attempt TAS User creation
                try:
                    form.save()
                    messages.success(
                        request,
                        'Congratulations! Your account migration was successful. You '
                        'still need you to activate your TACC account. You should an '
                        'activation code at the email address provided. Please follow '
                        'the instructions in the email to activate your account.'
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
                        form._errors.setdefault('username', [err_msg])
                    elif 'DuplicateEmailException' in error_type:
                        err_msg = (
                            'This email is already registered. If you already have an '
                            'account with TACC, please log in using those credentials.')
                        form._errors.setdefault('email', [err_msg])
                        err_msg = '%s <a href="%s">Did you forget your password?</a>' % (
                            err_msg,
                            reverse('designsafe_accounts:password_reset'))
                    elif 'PasswordInvalidException' in error_type:
                        err_msg = (
                            'The password you provided did not meet the complexity '
                            'requirements.')
                        form._errors.setdefault('password', [err_msg])
                    else:
                        err_msg = (
                            'An unexpected error occurred. If this problem persists '
                            'please create a support ticket.')

                    messages.error(request, err_msg)

            else:
                messages.error(request, 'There was an error processing your account '
                                        'migration. Please see below for details.')

            return render(request,
                          'designsafe/apps/accounts/nees_migration_step_2.html',
                          {'form': form})


    return HttpResponseRedirect(reverse('designsafe_accounts:nees_migration'))


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
                    'Congratulations! Your account request has been received. You should '
                    'receive an activation code at the email address provided. Please '
                    'follow the instructions in the email to activate your account.'
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


@login_required
def profile_edit(request):
    tas = TASClient()
    tas_user = tas.get_user(username=request.user)
    UserModel = get_user_model()
    user = UserModel.objects.get(username=request.user.username)

    if request.method == 'POST':
        form = forms.UserProfileForm(request.POST, initial=tas_user)
        if form.is_valid():
            data = form.cleaned_data

            # punt on PI Eligibility for now
            data['piEligibility'] = tas_user['piEligibility']

            # retain original account source
            data['source'] = tas_user['source']

            tas.save_user(tas_user['id'], data)
            messages.success(request, 'Your profile has been updated!')

            try:
                dsuser = DsUser.objects.get(user=user)
                dsuser.ethnicity = data['ethnicity']
                dsuser.gender = data['gender']
                dsuser.save()
            except ObjectDoesNotExist as e:
                logger.info('exception e: {} {}'.format(type(e), e ))
                demographics = DsUser(
                    user=user,
                    ethnicity=data['ethnicity'],
                    gender=data['gender']
                    )
                demographics.save()

            return HttpResponseRedirect(reverse('designsafe_accounts:manage_profile'))
    else:
        try:
            tas_user['ethnicity'] = user.profile.ethnicity
            tas_user['gender'] = user.profile.gender
        except ObjectDoesNotExist:
            pass
        form = forms.UserProfileForm(initial=tas_user)

    context = {
        'form': form,
        'user': tas_user,
        }
    return render(request, 'designsafe/apps/accounts/profile_edit.html', context)


def password_reset(request, code=None):
    if request.user is not None and request.user.is_authenticated():
        return HttpResponseRedirect(reverse('designsafe_accounts:manage_profile'))

    if code is None:
        code = request.GET.get('code', None)

    if code is not None:
        # confirming password reset
        message = 'Confirm your password reset using the form below. Enter your TACC ' \
                  'username and new password to complete the password reset process.'

        if request.method == 'POST':
            form = forms.PasswordResetConfirmForm(request.POST)
            if _process_password_reset_confirm(request, form):
                messages.success(request, 'Your password has been reset! You can now log '
                                          'in using your new password')
                return HttpResponseRedirect(reverse('designsafe_accounts:manage_profile'))
            else:
                messages.error(request, 'Password reset failed. '
                                        'Please see below for details.')
        else:
            form = forms.PasswordResetConfirmForm(initial={'code': code})

    else:
        # requesting password reset
        message = 'Enter your TACC username to request a password reset. If your ' \
                  'account is found, you will receive an email at the registered email ' \
                  'address with instructions to complete the password reset.'

        if request.method == 'POST':
            form = forms.PasswordResetRequestForm(request.POST)
            if _process_password_reset_request(request, form):
                form = forms.PasswordResetRequestForm()
            else:
                messages.error(request, 'Password reset request failed. '
                                        'Please see below for details.')
        else:
            form = forms.PasswordResetRequestForm()

    return render(request, 'designsafe/apps/accounts/password_reset.html',
                  {'message': message, 'form': form})


def _process_password_reset_request(request, form):
    if form.is_valid():
        # always show success to prevent data leaks
        messages.success(request, 'Your request has been received. If an account '
                                  'matching the username you provided is found, you will '
                                  'receive an email with further instructions to '
                                  'complete the password reset process.')

        username = form.cleaned_data['username']
        logger.info('Attempting password reset request for username: "%s"', username)
        try:
            tas = TASClient()
            user = tas.get_user(username=username)
            logger.info('Processing password reset request for username: "%s"', username)
            resp = tas.request_password_reset(user['username'], source='DesignSafe')
            logger.debug(resp)
        except Exception as e:
            logger.debug(e)
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
                    form.add_error('__all__', 'An unexpected error occurred. '
                                              'Please try again')
            else:
                form.add_error('__all__', 'An unexpected error occurred. '
                                          'Please try again')

    return False


def email_confirmation(request, code=None):
    context = {}
    if request.method == 'POST':
        form = forms.EmailConfirmationForm(request.POST)
        if form.is_valid():
            data = form.cleaned_data
            code = data['code']
            username = data['username']
            password = data['password']
            try:
                tas = TASClient()
                user = tas.get_user(username=username)
                if tas.verify_user(user['id'], code, password=password):
                    get_user_model().objects.create_user(
                        username=username,
                        first_name=user['firstName'],
                        last_name=user['lastName'],
                        email=user['email']
                        )
                    messages.success(request,
                                     'Congratulations, your account has been activated! '
                                     'You can now log in to DesignSafe-CI.')
                    return HttpResponseRedirect(
                        reverse('designsafe_accounts:manage_profile'))
                else:
                    messages.error(request,
                                   'We were unable to activate your account. Please try '
                                   'again. If this problem persists, please open a '
                                   'support ticket.')
                    form = forms.EmailConfirmationForm(
                        initial={'code': code, 'username': username})
            except:
                logger.exception('TAS Account activation failed')
                form.add_error('__all__',
                               'Account activation failed. Please confirm your '
                               'activation code, username and password and try '
                               'again.')
    else:
        if code is None:
            code = request.GET.get('code', '')
        form = forms.EmailConfirmationForm(initial={'code': code})

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

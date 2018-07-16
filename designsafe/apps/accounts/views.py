from django.shortcuts import render
from django.contrib import messages
from django.contrib.auth import get_user_model, logout
from django.contrib.auth.decorators import login_required, permission_required
from django.core.exceptions import ObjectDoesNotExist
from django.core.urlresolvers import reverse
from django.db.models import Q
from django.http import HttpResponse, HttpResponseRedirect, StreamingHttpResponse
from django.shortcuts import render_to_response
from django.utils.translation import ugettext_lazy as _
from designsafe.apps.accounts import forms, integrations
from designsafe.apps.accounts.models import (NEESUser, DesignSafeProfile,
                                             NotificationPreferences)
from designsafe.apps.auth.tasks import check_or_create_agave_home_dir
from pytas.http import TASClient
from pytas.models import User as TASUser
import logging
import json
import re
from termsandconditions.models import TermsAndConditions
import csv

logger = logging.getLogger(__name__)


def index(request):
    return HttpResponseRedirect(reverse('designsafe_accounts:manage_profile'))


@login_required
def manage_profile(request):
    """
    The default accounts view. Provides user settings for managing profile,
    authentication, notifications, identities, and applications.
    """
    django_user = request.user
    user_profile = TASUser(username=request.user.username)

    try:
        demographics = django_user.profile
    except ObjectDoesNotExist as e:
        demographics = {}
        logger.info('exception e:{} {}'.format(type(e), e))

    context = {
        'title': 'Account Profile',
        'profile': user_profile,
        'demographics': demographics
    }
    return render(request, 'designsafe/apps/accounts/profile.html', context)


@login_required
def manage_pro_profile(request):
    user = request.user
    try:
        ds_profile = DesignSafeProfile.objects.get(user__id=user.id)
    except DesignSafeProfile.DoesNotExist:
        logout(request)
        return HttpResponseRedirect(reverse('designsafe_auth:login'))
    context = {
        'title': 'Professional Profile',
        'user': user,
        'profile': ds_profile
    }
    return render(request, 'designsafe/apps/accounts/professional_profile.html', context)


@login_required
def pro_profile_edit(request):
    context = {}
    user = request.user
    ds_profile = DesignSafeProfile.objects.get(user_id=user.id)
    form = forms.ProfessionalProfileForm(request.POST or None, instance=ds_profile)
    if request.method == 'POST':
        if form.is_valid():
            form.save()
            return HttpResponseRedirect(reverse('designsafe_accounts:manage_pro_profile'))
    context["form"] = form
    return render(request, 'designsafe/apps/accounts/professional_profile_edit.html', context)


@login_required
def manage_authentication(request):
    if request.method == 'POST':
        form = forms.ChangePasswordForm(request.POST, username=request.user.username)
        if form.is_valid():
            form.save()
            messages.success(request, 'Your TACC Password has been successfully changed!')
    else:
        form = forms.ChangePasswordForm(username=request.user.username)

    context = {
        'title': 'Authentication',
        'form': form
    }
    return render(request, 'designsafe/apps/accounts/manage_auth.html', context)


@login_required
def manage_identities(request):
    context = {
        'title': 'Identities',
    }
    return render(request, 'designsafe/apps/accounts/manage_identities.html', context)


@login_required
def manage_notifications(request):
    try:
        prefs = NotificationPreferences.objects.get(user=request.user)
    except NotificationPreferences.DoesNotExist:
        prefs = NotificationPreferences(user=request.user)

    if request.method == 'POST':
        form = forms.NotificationPreferencesForm(request.POST, instance=prefs)
        form.save()
        messages.success(request, _('Your Notification Preferences have been updated!'))
    else:
        form = forms.NotificationPreferencesForm(instance=prefs)

    context = {
        'title': 'Notification Settings',
        'form': form,
    }

    return render(request, 'designsafe/apps/accounts/manage_notifications.html', context)


@login_required
def manage_licenses(request):
    from designsafe.apps.licenses.models import get_license_info
    licenses, license_models = get_license_info()
    licenses.sort(key=lambda x: x['license_type'])
    license_models.sort(key=lambda x: x.license_type)

    for l, m in zip(licenses, license_models):
        if m.objects.filter(user=request.user).exists():
            l['current_user_license'] = True
    context = {
        'title': 'Software Licenses',
        'licenses': licenses
    }
    return render(request, 'designsafe/apps/accounts/manage_licenses.html', context)


@login_required
def manage_applications(request):
    context = {
        'title': '3rd Party Applications',
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
        return HttpResponseRedirect('designsafe_accounts:index')

    if request.method == 'POST':
        account_form = forms.UserRegistrationForm(request.POST)
        if account_form.is_valid():
            try:
                account_form.save()
                return HttpResponseRedirect(
                    reverse('designsafe_accounts:registration_successful'))
            except Exception as e:
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

                    safe_data = account_form.cleaned_data.copy()
                    safe_data['password'] = safe_data['confirmPassword'] = '********'
                    logger.exception('User Registration Error!', extra=safe_data)
                    err_msg = (
                        'An unexpected error occurred. If this problem persists '
                        'please create a support ticket.')
                messages.error(request, err_msg)
        else:
            messages.error(request, 'There were errors processing your registration. '
                                    'Please see below for details.')
    else:
        account_form = forms.UserRegistrationForm()

    context = {
        'account_form': account_form
    }
    return render(request, 'designsafe/apps/accounts/register.html', context)


def registration_successful(request):
    return render_to_response('designsafe/apps/accounts/registration_successful.html')


@login_required
def profile_edit(request):
    tas = TASClient()
    user = request.user
    tas_user = tas.get_user(username=user.username)

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
                ds_profile = user.profile
                ds_profile.ethnicity = data['ethnicity']
                ds_profile.gender = data['gender']
                ds_profile.save()
            except ObjectDoesNotExist as e:
                logger.info('exception e: {} {}'.format(type(e), e ))
                ds_profile = DesignSafeProfile(
                    user=user,
                    ethnicity=data['ethnicity'],
                    gender=data['gender']
                    )
                ds_profile.save()

            return HttpResponseRedirect(reverse('designsafe_accounts:manage_profile'))
    else:
        try:
            tas_user['ethnicity'] = user.profile.ethnicity
            tas_user['gender'] = user.profile.gender
        except ObjectDoesNotExist:
            pass

        form = forms.UserProfileForm(initial=tas_user)

    context = {
        'title': 'Account Profile',
        'form': form,
    }
    return render(request, 'designsafe/apps/accounts/profile_edit.html', context)


def password_reset(request, code=None):
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
            logger.exception('Failed password reset request')

        return True
    else:
        return False


def _process_password_reset_confirm(request, form):
    if form.is_valid():
        data = form.cleaned_data
        try:
            tas = TASClient()
            return tas.confirm_password_reset(data['username'], data['code'],
                                              data['password'], source='DesignSafe')
        except Exception as e:
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
                    logger.exception('Password reset failed')
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
                    #check_or_create_agave_home_dir.apply_async(args=(user["username"],))

                    messages.success(request,
                                     'Congratulations, your account has been activated! '
                                     'You can now log in to DesignSafe.')
                    return HttpResponseRedirect(
                        reverse('designsafe_accounts:manage_profile'))
                else:
                    messages.error(request,
                                   'We were unable to activate your account. Please try '
                                   'again. If this problem persists, please '
                                   '<a href="/help">open a support ticket</a>.')
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


@permission_required('designsafe_accounts.view_notification_subscribers', raise_exception=True)
def mailing_list_subscription(request, list_name):
    subscribers = ['"Name","Email"']

    try:
        su = get_user_model().objects.filter(
            Q(notification_preferences__isnull=True) |
            Q(**{"notification_preferences__{}".format(list_name): True}))
        subscribers += list('"{0}","{1}"'.format(u.get_full_name().encode('utf-8'),\
        u.email.encode('utf-8')) for u in su)

    except TypeError as e:
        logger.warning('Invalid list name: {}'.format(list_name))
    return HttpResponse('\n'.join(subscribers), content_type='text/csv')

@permission_required('designsafe_accounts.view_notification_subscribers', raise_exception=True)
def user_report(request, list_name):
    # from designsafe.apps.accounts.tasks import create_report
    # create_report.apply_async()

    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment;filename="users_report_test.csv"'

    writer = csv.writer(response)
    writer.writerow(["UserName","Bio","Website","Orcid_id","Professional Level",\
            "Research Activities","NH_interests","Ethnicity","Gender"])

    # subscribers = []
    # try:
    professional_profile_user_list = DesignSafeProfile.objects.all()
    notification_list = get_user_model().objects.filter(
        Q(notification_preferences__isnull=True) |
        Q(**{"notification_preferences__{}".format(list_name): True}))
    for profile_user in professional_profile_user_list:
        # user_profile = TASUser(username=profile_user.user)
        if profile_user.user in notification_list:
            writer.writerow([profile_user.user,\
            # logger.debug('printing first profile_user_in_loop:{}'.format(user_profile.phone)
                
                profile_user.bio.encode('utf-8') if profile_user.bio else profile_user.bio,\
                profile_user.website.encode('utf-8') if profile_user.website else profile_user.website,\
                profile_user.orcid_id.encode('utf-8') if profile_user.orcid_id else profile_user.orcid_id,\
                profile_user.professional_level,\
                profile_user.research_activities,\
                profile_user.nh_interests,\
                # user_profile.email,\
                # user_profile.firstName.encode('utf-8') if user_profile.firstName else user_profile.firstName,\
                # user_profile.lastName.encode('utf-8') if user_profile.lastName else user_profile.lastName,\
                # user_profile.institution.encode('utf-8') if user_profile.institution else user_profile.institution,\
                # user_profile.phone.encode('utf-8') if user_profile.phone else user_profile.phone,\
                # user_profile.country,\ #country of residency
                profile_user.ethnicity,\
                profile_user.gender,\
                # user_profile.citizenship,\ #country of citizenship
            #         ))
                ])

    # except TypeError as e:
    #     logger.warning('Invalid list name: {}'.format(list_name))
    return response

# class Echo:
#     """An object that implements just the write method of the file-like
#     interface. Streams user_report that otherwise takes a long time to 
#     generate dropping the connection that will otherwise timed out while the server was generating the response
#     """
#     def write(self, value):
#         """Write the value by returning it, instead of storing in a buffer."""
#         return value

# @permission_required('designsafe_accounts.view_notification_subscribers', raise_exception=True)
# def user_report(request, list_name):
#     # from designsafe.apps.accounts.tasks import create_report
#     # create_report.apply_async()

#     subscribers = ['"UserName","Bio","Website","Orcid_id","Professional Level",\
#             "Research Activities","NH_interests","Ethnicity","Gender"']
#     logger.debug('I AM PRITNING SUBSCRIBERS: {}'.format(subscribers))
#     # try:
#     professional_profile_user_list = DesignSafeProfile.objects.all()
#     notification_list = get_user_model().objects.filter(
#         Q(notification_preferences__isnull=True) |
#         Q(**{"notification_preferences__{}".format(list_name): True}))
#     for profile_user in professional_profile_user_list:
#         # user_profile = TASUser(username=profile_user.user)
#         if profile_user.user in notification_list:
#             # logger.debug('printing first profile_user_in_loop:{}'.format(user_profile.phone))
#             subscribers.append(
#                 '"{0}"'.format(
#                     profile_user.user
#                     # profile_user.bio.encode('utf-8') if profile_user.bio else profile_user.bio,\
#                     # profile_user.website.encode('utf-8') if profile_user.website else profile_user.website,\
#                     # profile_user.orcid_id.encode('utf-8') if profile_user.orcid_id else profile_user.orcid_id,\
#                     # profile_user.professional_level,\
#                     # profile_user.research_activities,\
#                     # profile_user.nh_interests,\
#                     # user_profile.email,\
#                     # user_profile.firstName.encode('utf-8') if user_profile.firstName else user_profile.firstName,\
#                     # user_profile.lastName.encode('utf-8') if user_profile.lastName else user_profile.lastName,\
#                     # user_profile.institution.encode('utf-8') if user_profile.institution else user_profile.institution,\
#                     # user_profile.phone.encode('utf-8') if user_profile.phone else user_profile.phone,\
#                     # user_profile.country,\ #country of residency
#                     # profile_user.ethnicity,\
#                     # profile_user.gender,\
#                     # user_profile.citizenship,\ #country of citizenship
#                     ))

#     # except TypeError as e:
#     #     logger.warning('Invalid list name: {}'.format(list_name))
#     pseudo_buffer = Echo()
#     writer = csv.writer(pseudo_buffer)
#     response = StreamingHttpResponse((writer.writerows(subscribers)), 
#         content_type="text/csv")
#     response['Content-Disposition'] = 'attachment; filename="user_report.csv"'
#     return response
#     # return HttpResponse('\n'.join(subscribers), content_type='text/csv')
   

def termsandconditions(request):
    context = {
        'title': 'Terms and Conditions',
        'terms': TermsAndConditions.get_active(),
    }
    #context['terms'] = TermsAndConditions.get_active()
    return render(request, 'designsafe/apps/accounts/termsandconditions.html', context)

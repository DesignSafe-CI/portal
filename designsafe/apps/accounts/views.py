from django.shortcuts import render
from django.contrib import messages
from django.contrib.auth import get_user_model, logout
from django.contrib.auth.decorators import login_required, permission_required
from django.core.exceptions import ObjectDoesNotExist
from django.urls import reverse
from django.conf import settings
from django.db.models import Q
from django.http import HttpResponse, HttpResponseRedirect
from django.utils.translation import gettext_lazy as _
from designsafe.apps.accounts import forms, integrations
from designsafe.apps.accounts.models import (
    NEESUser,
    DesignSafeProfile,
    NotificationPreferences,
)
from designsafe.apps.auth.tasks import check_or_create_agave_home_dir
from designsafe.apps.accounts.tasks import create_report
from pytas.http import TASClient
from pytas.models import User as TASUser
import logging
import json
import requests
import re
from termsandconditions.models import TermsAndConditions

logger = logging.getLogger(__name__)


def index(request):
    return HttpResponseRedirect(reverse("designsafe_accounts:manage_profile"))


@login_required
def manage_profile(request):
    """
    The default accounts view. Provides user settings for managing profile,
    authentication, notifications, identities, and applications.
    """
    django_user = request.user
    user_profile = TASUser(username=request.user.username)
    try:
        ds_profile = DesignSafeProfile.objects.get(user__id=django_user.id)
    except DesignSafeProfile.DoesNotExist:
        logout(request)
        return HttpResponseRedirect(reverse("designsafe_auth:login"))

    try:
        demographics = django_user.profile
    except ObjectDoesNotExist as e:
        demographics = {}
        logger.info("exception e:{} {}".format(type(e), e))

    context = {
        "title": "Account Profile",
        "profile": user_profile,
        "ds_profile": ds_profile,
        "demographics": demographics,
        "user": django_user,
    }
    return render(request, "designsafe/apps/accounts/profile.html", context)


@login_required
def manage_authentication(request):
    if request.method == "POST":
        form = forms.ChangePasswordForm(request.POST, username=request.user.username)
        if form.is_valid():
            form.save()
            messages.success(
                request, "Your TACC Password has been successfully changed!"
            )
    else:
        form = forms.ChangePasswordForm(username=request.user.username)

    context = {"title": "Authentication", "form": form}
    return render(request, "designsafe/apps/accounts/manage_auth.html", context)


@login_required
def manage_identities(request):
    context = {
        "title": "Identities",
    }
    return render(request, "designsafe/apps/accounts/manage_identities.html", context)


@login_required
def manage_notifications(request):
    try:
        prefs = NotificationPreferences.objects.get(user=request.user)
    except NotificationPreferences.DoesNotExist:
        prefs = NotificationPreferences(user=request.user)

    if request.method == "POST":
        form = forms.NotificationPreferencesForm(request.POST, instance=prefs)
        form.save()
        messages.success(request, _("Your Notification Preferences have been updated!"))
    else:
        form = forms.NotificationPreferencesForm(instance=prefs)

    context = {
        "title": "Notification Settings",
        "form": form,
    }

    return render(
        request, "designsafe/apps/accounts/manage_notifications.html", context
    )


@login_required
def manage_licenses(request):
    from designsafe.apps.licenses.models import get_license_info

    licenses, license_models = get_license_info()
    licenses.sort(key=lambda x: x["license_type"])
    license_models.sort(key=lambda x: x.license_type)

    for l, m in zip(licenses, license_models):
        if m.objects.filter(user=request.user).exists():
            l["current_user_license"] = True
    context = {"title": "Software Licenses", "licenses": licenses}
    return render(request, "designsafe/apps/accounts/manage_licenses.html", context)


@login_required
def manage_applications(request):
    context = {
        "title": "3rd Party Applications",
        "integrations": integrations.get_integrations(),
    }
    return render(request, "designsafe/apps/accounts/manage_applications.html", context)


def nees_migration(request, step=None):

    if step == 0 or step is None:
        return render(
            request,
            "designsafe/apps/accounts/nees_migration.html",
            {"form": forms.NEESAccountMigrationForm()},
        )

    elif step == "1":
        if request.method == "POST":
            email_address = request.POST.get("email_address")
        else:
            email_address = request.GET.get("email_address")
        if email_address:
            nees_user_match = NEESUser.lookup_user(email_address)
            if len(nees_user_match) == 0:
                messages.error(
                    request,
                    "We were unable to locate a NEEShub account for the email "
                    "address <b>%s</b>. Please confirm that you entered the "
                    "email address correctly and try again. If you feel this "
                    "is in error, please submit a support ticket." % email_address,
                )
                return HttpResponseRedirect(
                    reverse("designsafe_accounts:nees_migration")
                )
            else:
                tas_by_username = None
                tas_by_email = None
                # check for existing TAS user
                tas_api = TASClient()
                try:
                    tas_by_username = tas_api.get_user(
                        username=nees_user_match[0].username
                    )
                except:
                    logger.exception("Error checking for existing TAS users")
                try:
                    tas_by_email = tas_api.get_user(email=nees_user_match[0].email)
                except:
                    logger.exception("Error checking for existing TAS users")

                context = {
                    "email_address": email_address,
                    "nees_user_match": nees_user_match,
                    "tas_by_username": tas_by_username,
                    "tas_by_email": tas_by_email,
                }
                return render(
                    request,
                    "designsafe/apps/accounts/nees_migration_step_1.html",
                    context,
                )

    elif step == "2":
        tas_api = TASClient()
        if request.method == "POST":
            email_address = request.POST.get("email_address")
            nees_user_match = NEESUser.lookup_user(email_address)
            countries = tas_api.countries()
            country_residence = next(
                (
                    c
                    for c in countries
                    if c["abbrev"] == nees_user_match[0].countryresident
                ),
                {"id": None},
            )
            country_origin = next(
                (
                    c
                    for c in countries
                    if c["abbrev"] == nees_user_match[0].countryorigin
                ),
                {"id": None},
            )
            initial_data = {
                "firstName": nees_user_match[0].givenName,
                "lastName": nees_user_match[0].surname,
                "email": nees_user_match[0].email,
                "phone": nees_user_match[0].phone,
                "countryId": country_residence["id"],
                "citizenshipId": country_origin["id"],
                "username": nees_user_match[0].username,
            }
            if nees_user_match[0].organization is not None:
                initial_data["institutionId"] = -1
                initial_data["institution"] = nees_user_match[0].organization
            form = forms.UserRegistrationForm(initial=initial_data)
            return render(
                request,
                "designsafe/apps/accounts/nees_migration_step_2.html",
                {"form": form},
            )

    elif step == "3":
        # final step!
        tas_api = TASClient()
        if request.method == "POST":
            form = forms.UserRegistrationForm(request.POST)
            if form.is_valid():
                # attempt TAS User creation
                try:
                    form.save()
                    messages.success(
                        request,
                        "Congratulations! Your account migration was successful. You "
                        "still need you to activate your TACC account. You should an "
                        "activation code at the email address provided. Please follow "
                        "the instructions in the email to activate your account.",
                    )
                    return HttpResponseRedirect("/")
                except Exception as e:
                    logger.exception("Error saving user!")
                    logger.info("error: {}".format(e))

                    error_type = e.args[1] if len(e.args) > 1 else ""

                    if "DuplicateLoginException" in error_type:
                        err_msg = (
                            "The username you chose has already been taken. Please "
                            "choose another. If you already have an account with TACC, "
                            "please log in using those credentials."
                        )
                        form._errors.setdefault("username", [err_msg])
                    elif "DuplicateEmailException" in error_type:
                        err_msg = (
                            "This email is already registered. If you already have an "
                            "account with TACC, please log in using those credentials."
                        )
                        form._errors.setdefault("email", [err_msg])
                        err_msg = (
                            '%s <a href="%s">Did you forget your password?</a>'
                            % (err_msg, reverse("designsafe_accounts:password_reset"))
                        )
                    elif "PasswordInvalidException" in error_type:
                        err_msg = (
                            "The password you provided did not meet the complexity "
                            "requirements."
                        )
                        form._errors.setdefault("password", [err_msg])
                    else:
                        err_msg = (
                            "An unexpected error occurred. If this problem persists "
                            "please create a support ticket."
                        )

                    messages.error(request, err_msg)

            else:
                messages.error(
                    request,
                    "There was an error processing your account "
                    "migration. Please see below for details.",
                )

            return render(
                request,
                "designsafe/apps/accounts/nees_migration_step_2.html",
                {"form": form},
            )
    return HttpResponseRedirect(reverse("designsafe_accounts:nees_migration"))


class MissingCaptchaError(Exception):
    pass


def register(request):
    logger.debug("formatting %s", {"hello": "world"})
    context = {"RECAPTCHA_PUBLIC_KEY": settings.RECAPTCHA_PUBLIC_KEY}
    if request.method == "POST":
        try:
            # Verify captcha
            captcha_resp = requests.post(
                "https://www.google.com/recaptcha/api/siteverify",
                data={
                    "secret": settings.RECAPTCHA_PRIVATE_KEY,
                    "response": request.POST.get("g-recaptcha-response"),
                },
                timeout=10,
            )
            captcha_resp.raise_for_status()
            captcha_json = captcha_resp.json()
            if not captcha_json.get("success", False):
                messages.error(
                    request,
                    "Please complete the reCAPTCHA before submitting your account request.",
                )
                return render(
                    request, "designsafe/apps/accounts/register.html", context
                )

            # Once captcha is verified, send request to TRAM.
            tram_headers = {"tram-services-key": settings.TRAM_SERVICES_KEY}
            tram_body = {
                "project_id": settings.TRAM_PROJECT_ID,
                "email": request.POST.get("email"),
            }
            tram_resp = requests.post(
                f"{settings.TRAM_SERVICES_URL}/project_invitations/create",
                headers=tram_headers,
                json=tram_body,
                timeout=15,
            )
            tram_resp.raise_for_status()
            logger.info("Received response from TRAM: %s", tram_resp.json())
            messages.success(
                request,
                "Your request has been received. Please check your email for a project invitation.",
            )

        except requests.HTTPError as exc:
            logger.debug(exc)
            messages.error(
                request, "An unknown error occurred. Please try again later."
            )

    return render(request, "designsafe/apps/accounts/register.html", context)


@login_required
def profile_edit(request):
    tas = TASClient()
    user = request.user
    tas_user = tas.get_user(username=user.username)

    user = request.user
    ds_profile = DesignSafeProfile.objects.get(user_id=user.id)
    pro_form = forms.ProfessionalProfileForm(request.POST or None, instance=ds_profile)

    if request.method == "POST":
        if pro_form.is_valid():

            pro_form.save()

            pro_data = pro_form.cleaned_data
            # punt on PI Eligibility for now

            # retain original account source
            messages.success(request, "Your profile has been updated!")

            try:
                ds_profile = user.profile
                ds_profile.bio = pro_data["bio"]
                ds_profile.website = pro_data["website"]
                ds_profile.orcid_id = pro_data["orcid_id"]
                ds_profile.professional_level = pro_data["professional_level"]
                ds_profile.nh_interests_primary = pro_data["nh_interests_primary"]

            except ObjectDoesNotExist as e:
                logger.info("exception e: {} {}".format(type(e), e))
                ds_profile = DesignSafeProfile(
                    user=user,
                    bio=pro_data["bio"],
                    website=pro_data["website"],
                    orcid_id=pro_data["orcid_id"],
                    professional_level=pro_data["professional_level"],
                    nh_interests_primary=pro_data["nh_interests_primary"],
                )

            ds_profile.update_required = False
            ds_profile.save()

            return HttpResponseRedirect(reverse("designsafe_accounts:manage_profile"))
    else:
        try:
            tas_user["ethnicity"] = user.profile.ethnicity
            tas_user["gender"] = user.profile.gender
        except ObjectDoesNotExist:
            pass

        form = forms.UserProfileForm(initial=tas_user)

    context = {"title": "Account Profile", "form": form, "pro_form": pro_form}
    return render(request, "designsafe/apps/accounts/profile_edit.html", context)


def password_reset(request, code=None):
    if code is None:
        code = request.GET.get("code", None)

    if code is not None:
        # confirming password reset
        message = (
            "Confirm your password reset using the form below. Enter your TACC "
            "username and new password to complete the password reset process."
        )

        if request.method == "POST":
            form = forms.PasswordResetConfirmForm(request.POST)
            if _process_password_reset_confirm(request, form):
                messages.success(
                    request,
                    "Your password has been reset! You can now log "
                    "in using your new password",
                )
                return HttpResponseRedirect(
                    reverse("designsafe_accounts:manage_profile")
                )
            else:
                messages.error(
                    request, "Password reset failed. " "Please see below for details."
                )
        else:
            form = forms.PasswordResetConfirmForm(initial={"code": code})

    else:
        # requesting password reset
        message = (
            "Enter your TACC username to request a password reset. If your "
            "account is found, you will receive an email at the registered email "
            "address with instructions to complete the password reset."
        )

        if request.method == "POST":
            form = forms.PasswordResetRequestForm(request.POST)
            if _process_password_reset_request(request, form):
                form = forms.PasswordResetRequestForm()
            else:
                messages.error(
                    request,
                    "Password reset request failed. " "Please see below for details.",
                )
        else:
            form = forms.PasswordResetRequestForm()

    return render(
        request,
        "designsafe/apps/accounts/password_reset.html",
        {"message": message, "form": form},
    )


def _process_password_reset_request(request, form):
    if form.is_valid():
        # always show success to prevent data leaks
        messages.success(
            request,
            "Your request has been received. If an account "
            "matching the username you provided is found, you will "
            "receive an email with further instructions to "
            "complete the password reset process.",
        )

        username = form.cleaned_data["username"]
        logger.info('Attempting password reset request for username: "%s"', username)
        try:
            tas = TASClient()
            user = tas.get_user(username=username)
            logger.info(
                'Processing password reset request for username: "%s"', username
            )
            resp = tas.request_password_reset(user["username"], source="DesignSafe")
            logger.debug(resp)
        except Exception as e:
            logger.exception("Failed password reset request")

        return True
    else:
        return False


def _process_password_reset_confirm(request, form):
    if form.is_valid():
        data = form.cleaned_data
        try:
            tas = TASClient()
            return tas.confirm_password_reset(
                data["username"], data["code"], data["password"], source="DesignSafe"
            )
        except Exception as e:
            if len(e.args) > 1:
                if re.search("account does not match", e.args[1]):
                    form.add_error("username", e.args[1])
                elif re.search("No password reset request matches", e.args[1]):
                    form.add_error("code", e.args[1])
                elif re.search("complexity requirements", e.args[1]):
                    form.add_error("password", e.args[1])
                elif re.search("expired", e.args[1]):
                    form.add_error("code", e.args[1])
                else:
                    logger.exception("Password reset failed")
                    form.add_error(
                        "__all__", "An unexpected error occurred. " "Please try again"
                    )
            else:
                form.add_error(
                    "__all__", "An unexpected error occurred. " "Please try again"
                )

    return False


def email_confirmation(request, code=None):
    context = {}
    if request.method == "POST":
        form = forms.EmailConfirmationForm(request.POST)
        if form.is_valid():
            data = form.cleaned_data
            code = data["code"]
            username = data["username"]
            password = data["password"]
            try:
                tas = TASClient()
                user = tas.get_user(username=username)
                if tas.verify_user(user["id"], code, password=password):
                    logger.info("TAS Account activation succeeded.")
                    from django.conf import settings

                    check_or_create_agave_home_dir.apply_async(
                        args=(user.username, settings.AGAVE_STORAGE_SYSTEM)
                    )
                    check_or_create_agave_home_dir.apply_async(
                        args=(user.username, settings.AGAVE_WORKING_SYSTEM)
                    )
                    return HttpResponseRedirect(
                        reverse("designsafe_accounts:manage_profile")
                    )
                else:
                    messages.error(
                        request,
                        "We were unable to activate your account. Please try "
                        "again. If this problem persists, please "
                        '<a href="/help">open a support ticket</a>.',
                    )
                    form = forms.EmailConfirmationForm(
                        initial={"code": code, "username": username}
                    )
            except:
                logger.exception("TAS Account activation failed")
                form.add_error(
                    "__all__",
                    "Account activation failed. Please confirm your "
                    "activation code, username and password and try "
                    "again.",
                )
    else:
        if code is None:
            code = request.GET.get("code", "")
        form = forms.EmailConfirmationForm(initial={"code": code})

    context["form"] = form

    return render(request, "designsafe/apps/accounts/email_confirmation.html", context)


@permission_required(
    "designsafe_accounts.view_notification_subscribers", raise_exception=True
)
def mailing_list_subscription(request, list_name):
    subscribers = ['"Name","Email"']

    try:
        su = get_user_model().objects.filter(
            Q(notification_preferences__isnull=True)
            | Q(**{"notification_preferences__{}".format(list_name): True})
        )
        subscribers += list(
            '"{0}","{1}"'.format(u.get_full_name(), u.email) for u in su
        )

    except TypeError as e:
        logger.warning("Invalid list name: {}".format(list_name))
    return HttpResponse("\n".join(subscribers), content_type="text/csv")


@permission_required(
    "designsafe_accounts.view_notification_subscribers", raise_exception=True
)
def user_report(request, list_name):

    django_user = request.user

    create_report.apply_async(args=((django_user.username, list_name)))

    context = {
        "title": "Generating Report",
    }

    return render(
        request, "designsafe/apps/accounts/generating_user_report.html", context
    )


def termsandconditions(request):
    context = {
        "title": "Terms and Conditions",
        "terms": TermsAndConditions.get_active(),
    }
    # context['terms'] = TermsAndConditions.get_active()
    return render(request, "designsafe/apps/accounts/termsandconditions.html", context)

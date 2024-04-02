import re
import logging
from django import forms
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils.translation import gettext as _
from django.utils.safestring import mark_safe
from django.utils.html import escape
from snowpenguin.django.recaptcha2.fields import ReCaptchaField
from snowpenguin.django.recaptcha2.widgets import ReCaptchaWidget

from .models import (DesignSafeProfile, NotificationPreferences,
                     DesignSafeProfileNHInterests, DesignSafeProfileResearchActivities,
                     DesignSafeProfileNHTechnicalDomains)
from termsandconditions.models import TermsAndConditions, UserTermsAndConditions
from pytas.http import TASClient

LOGGER = logging.getLogger(__name__)

ELIGIBLE = 'Eligible'
INELIGIBLE = 'Ineligible'
REQUESTED = 'Requested'
PI_ELIGIBILITY = (
    ('', 'Choose One'),
    (ELIGIBLE, ELIGIBLE),
    (INELIGIBLE, INELIGIBLE),
    (REQUESTED, REQUESTED),
)


USER_PROFILE_TITLES = (
    ('', 'Choose one'),
    ('Center Non-Researcher Staff', 'Center Non-Researcher Staff'),
    ('Center Researcher Staff', 'Center Researcher Staff'),
    ('Faculty', 'Faculty'),
    ('Government User', 'Government User'),
    ('Graduate Student', 'Graduate Student'),
    ('High School Student', 'High School Student'),
    ('High School Teacher', 'High School Teacher'),
    ('Industrial User', 'Industrial User'),
    ('Unaffiliated User', 'Unaffiliated User'),
    ('Nonprofit User', 'Nonprofit User'),
    ('NSF Graduate Research Fellow', 'NSF Graduate Research Fellow'),
    ('Other User', 'Other User'),
    ('Postdoctorate', 'Postdoctorate'),
    ('Undergraduate Student', 'Undergraduate Student'),
    ('Unknown', 'Unknown'),
    ('University Non-Research Staff', 'University Non-Research Staff'),
    ('University Research Staff', 'University Research Staff (excluding postdoctorates)'),
)
ETHNICITY_OPTIONS = (
    ('', 'Choose one'),
    ('Decline', 'Decline to Identify'),
    ('White', 'White'),
    ('Asian', 'Asian'),
    ('Black or African American', 'Black or African American'),
    ('Hispanic or Latino', 'Hispanic or Latino'),
    ('American Indian or Alaska Native', 'American Indian or Alaska Native'),
    ('Native Hawaiian or Other Pacific Islander', 'Native Hawaiian or Other Pacific Islander'),
    ('Two or more races', 'Two or more races, not Hispanic')
)

GENDER_OPTIONS = (
    ('', 'Choose one'),
    ('Decline', 'Decline to Identify'),
    ('Male', 'Male'),
    ('Female', 'Female'),
    ('Other', 'Other'),
)

PROFESSIONAL_LEVEL_OPTIONS = (
    ('Undergraduate Student', 'Undergraduate Student'),
    ('Graduate Student', 'Graduate Student'),
    ('Postdoctoral Researcher', 'Postdoctoral Researcher'),
    ('Faculty or Researcher', 'Faculty or Researcher'),
    ('Staff (support, administration, etc)', 'Staff (support, administration, etc)'),
    ('Practicing Engineer or Architect', 'Practicing Engineer or Architect'),
    ('Other', 'Other (Please describe in your interests above)')
)



def get_institution_choices():
    tas = TASClient()
    institutions_list = tas.institutions()
    return (('', 'Choose one'),) + tuple((c['id'], c['name']) for c in institutions_list)


def get_country_choices():
    tas = TASClient()
    countries_list = tas.countries()
    return (('', 'Choose one'),) + tuple((c['id'], c['name']) for c in countries_list)


class EmailConfirmationForm(forms.Form):
    code = forms.CharField(
            label='Enter Your Activation Code',
            required=True,
            error_messages={
                'required': 'Please enter the activation code you received via email.'
            })

    username = forms.CharField(
            label='Enter Your TACC Username',
            required=True)

    password = forms.CharField(
            widget=forms.PasswordInput,
            label='Enter Your TACC Password',
            required=True)


def check_password_policy(user, password, confirmPassword):
    """
    Checks the password for meeting the minimum password policy requirements:
    * Must be a minimum of 8 characters in length
    * Must contain characters from at least three of the following: uppercase letters,
      lowercase letters, numbers, symbols
    * Must NOT contain the username or the first or last name from the profile

    Returns:
        A boolean value indicating if the password meets the policy,
        An error message string or None
    """
    if password != confirmPassword:
        return False, 'The password provided does not match the confirmation.'

    if len(password) < 8:
        return False, 'The password provided is too short. Please review the password criteria.'

    char_classes = 0
    for cc in ['[a-z]', '[A-Z]', '[0-9]', '[^a-zA-Z0-9]']:
        if re.search(cc, password):
            char_classes += 1

    if char_classes < 3:
        return False, 'The password provided does not meet the complexity requirements.'

    pwd_without_case = password.lower()
    if user['username'].lower() in pwd_without_case:
        return False, 'The password provided must not contain parts of your name or username.'

    if user['firstName'].lower() in pwd_without_case or \
        user['lastName'].lower() in pwd_without_case:
        return False, 'The password provided must not contain parts of your name or username.'

    return True, None


class ChangePasswordForm(forms.Form):

    current_password = forms.CharField(widget=forms.PasswordInput)
    new_password = forms.CharField(widget=forms.PasswordInput)
    confirm_new_password = forms.CharField(
        widget=forms.PasswordInput,
        help_text='Passwords must meet the following criteria:<ul>'
                  '<li>Must not contain your username or parts of your full name;</li>'
                  '<li>Must be a minimum of 8 characters in length;</li>'
                  '<li>Must contain characters from at least three of the following: '
                  'uppercase letters, lowercase letters, numbers, symbols</li></ul>')

    def __init__(self, *args, **kwargs):
        self._username = kwargs.pop('username')
        super(ChangePasswordForm, self).__init__(*args, **kwargs)

    def clean(self):
        cleaned_data = self.cleaned_data
        reset_link = reverse('designsafe_accounts:password_reset')
        tas = TASClient()
        current_password_correct = tas.authenticate(self._username,
                                                    cleaned_data['current_password'])
        if current_password_correct:
            tas_user = tas.get_user(username=self._username)
            pw = cleaned_data['new_password']
            confirm_pw = cleaned_data['confirm_new_password']
            valid, error_message = check_password_policy(tas_user, pw, confirm_pw)
            if not valid:
                self.add_error('new_password', error_message)
                self.add_error('confirm_new_password', error_message)
                raise forms.ValidationError(error_message)
        else:
            err_msg = mark_safe(
                'The current password you provided is incorrect. Please try again. '
                'If you do not remember your current password you can '
                '<a href="%s" tabindex="-1">reset your password</a> with an email '
                'confirmation.' % reset_link)
            self.add_error('current_password', err_msg)

    def save(self):
        cleaned_data = self.cleaned_data
        tas = TASClient()
        tas.change_password(self._username, cleaned_data['current_password'],
                            cleaned_data['new_password'])


class PasswordResetRequestForm(forms.Form):
    username = forms.CharField(label='Enter Your TACC Username', required=True)


class PasswordResetConfirmForm(forms.Form):
    code = forms.CharField(label='Reset Code', required=True)
    username = forms.CharField(label='Enter Your TACC Username', required=True)
    password = forms.CharField(widget=forms.PasswordInput, label='New Password', required=True)
    confirmPassword = forms.CharField(
        widget=forms.PasswordInput,
        label='Confirm New Password',
        required=True,
        help_text='Passwords must meet the following criteria:<ul>'
                  '<li>Must not contain your username or parts of your full name;</li>'
                  '<li>Must be a minimum of 8 characters in length;</li>'
                  '<li>Must contain characters from at least three of the following: '
                  'uppercase letters, lowercase letters, numbers, symbols</li></ul>')

    def clean(self):
        cleaned_data = self.cleaned_data
        username = cleaned_data.get('username')

        try:
            tas = TASClient()
            user = tas.get_user(username=username)
        except:
            msg = 'The username provided does not match an existing user.'
            self.add_error('username', msg)
            raise forms.ValidationError(msg)

        password = cleaned_data.get('password')
        confirmPassword = cleaned_data.get('confirmPassword')

        valid, error_message = check_password_policy(user, password, confirmPassword)
        if not valid:
            self.add_error('password', error_message)
            self.add_error('confirmPassword', '')
            raise forms.ValidationError(error_message)


class UserProfileForm(forms.Form):
    """
    Any changes to this for may require updates to the field_order
    in the UserRegistrationForm.
    """
    firstName = forms.CharField(label='First name')
    lastName = forms.CharField(label='Last name')
    ethnicity = forms.ChoiceField(label='Ethnicity', choices=ETHNICITY_OPTIONS)
    gender = forms.ChoiceField(label='Gender', choices=GENDER_OPTIONS)

    def __init__(self, *args, **kwargs):
        super(UserProfileForm, self).__init__(*args, **kwargs)


class TasUserProfileAdminForm(forms.Form):
    """
    Admin Form for TAS User Profile. Adds a field to trigger a password reset
    on the User's behalf.
    """
    firstName = forms.CharField(label="First name")
    lastName = forms.CharField(label="Last name")
    email = forms.EmailField()
    phone = forms.CharField()
    piEligibility = forms.ChoiceField(
        choices=PI_ELIGIBILITY,
        label="PI Eligibility"
       )
    reset_password = forms.BooleanField(
        required=False,
        label="Reset user's password",
        help_text="Check this box to reset the user's password. The user will be "
            "notified via email with instructions to complete the password reset."
       )


class ProfessionalProfileForm(forms.ModelForm):
    """
    Any changes made to this form need
    to be reflected in the UserRegistrationForm
    1) make sure the fields are in the correct order (field_order var)
    2) Specifically, update the UserRegistrationForm.savew() function
    to make sure all the pro profile fields are saved.
    """
    bio_placeholder = (
        'Please provide a brief summary of your professional profile, '
        'the natural hazards activities with which you are involved or '
        'would like to be involved, and any other comments that would help '
        'identify your experience and interest within the community. '
    )
    nh_interests_primary = forms.ModelChoiceField(
        queryset=DesignSafeProfileNHInterests.objects.all(),
        label="Primary Natural Hazards Interest"
    )
    nh_interests = forms.ModelMultipleChoiceField(
        queryset=DesignSafeProfileNHInterests.objects.all(),
        widget=forms.CheckboxSelectMultiple,
        required=False,
        label="Natural Hazards Interests (check all that apply)"
    )
    nh_technical_domains = forms.ModelMultipleChoiceField(
        queryset=DesignSafeProfileNHTechnicalDomains.objects.all(),
        required=True,
        widget=forms.CheckboxSelectMultiple,
        label="Technical Domains (check all that apply)"
    )
    bio = forms.CharField(
        max_length=4096,
        widget=forms.Textarea(attrs={'placeholder': bio_placeholder}),
        label='Professional and Research Interests',
        required=False
    )
    website = forms.CharField(max_length=256, required=False, label="Personal Website")
    orcid_id = forms.CharField(max_length=256, required=False, label="Orcid ID")
    professional_level = forms.ChoiceField(
        choices=PROFESSIONAL_LEVEL_OPTIONS,
        widget=forms.RadioSelect,
        required=True)
    research_activities = forms.ModelMultipleChoiceField(
        queryset=DesignSafeProfileResearchActivities.objects.all(),
        required=True,
        widget=forms.CheckboxSelectMultiple,
        label="Research Activities (check all that apply)"
    )

    field_order = ['nh_interests_primary', 'nh_interests', 'nh_technical_domains',
                  'bio', 'website', 'orcid_id', 'professional_level', 'research_activities']

    def clean_website(self):
        ws = self.cleaned_data['website']
        if (ws != '') and (not ws.startswith('http://')):
            ws = "http://" + ws
        return ws or None

    # def clean_bio(self):
    #     bio = self.cleaned_data['bio']
    #     bio = escape(bio)
    #     return bio

    class Meta:
        model = DesignSafeProfile
        exclude = ['user', 'ethnicity', 'gender', 'update_required', 'institution']


class UserRegistrationForm(UserProfileForm, ProfessionalProfileForm):
    #overriding form fields
    email = forms.EmailField(
        help_text='Please use your Institution/Business/School email when registering (not a gmail account). '
                    'This will expedite the process of approving your account.'
    )
    institution = forms.CharField(
        label='Institution name',
        help_text='If your institution is not listed, please provide the name of the '
                  'institution as it should be shown here.',
        required=False,
                                      )
    #additional fields for registration form
    confirmEmail = forms.CharField(label='Confirm Email')
    username = forms.RegexField(
        label='Username',
        help_text='Usernames must be 3-8 characters in length, start with a letter, and '
                  'can contain only lowercase letters, numbers, or underscore.',
        regex='^[a-z][a-z0-9_]{2,7}$')
    password = forms.CharField(widget=forms.PasswordInput, label='Password')
    confirmPassword = forms.CharField(
        label='Confirm Password', widget=forms.PasswordInput,
        help_text='Passwords must meet the following criteria:<ul>'
                  '<li>Must not contain your username or parts of your full name;</li>'
                  '<li>Must be a minimum of 8 characters in length;</li>'
                  '<li>Must contain characters from at least three of the following: '
                  'uppercase letters, lowercase letters, numbers, symbols</li></ul>')
    agree_to_terms = forms.BooleanField(
        label='I Agree to the <a href="/account/terms-conditions/" target="_blank" aria-describedby="msg-open-new-window">Terms of Use</a>',
        error_messages={'required': 'Please Accept the DesignSafe Terms of Use.'})
    agree_to_account_limit = forms.BooleanField(
        label='One account per user. I hereby verify that this is my only DesignSafe/TACC account'
              ' and I understand that having multiple accounts will result in suspension.',
        error_messages={'required': 'Please Agree to the DesignSafe Account Limit.'})

    captcha = ReCaptchaField(widget=ReCaptchaWidget)

    field_order = ['firstName', 'lastName', 'email', 'confirmEmail',
                  'phone', 'institutionId', 'institution',
                  'title', 'countryId', 'citizenshipId', 'ethnicity', 'gender',
                  'nh_interests_primary', 'nh_interests', 'nh_technical_domains',
                  'bio', 'website', 'orcid_id', 'professional_level', 'research_activities']

    def __init__(self, *args, **kwargs):
        super(UserRegistrationForm, self).__init__(*args, **kwargs)
        self.fields['institutionId'].choices = get_institution_choices()
        self.fields['institutionId'].choices += (('-1', 'My Institution is not listed'),)
        self.fields['countryId'].choices = get_country_choices()
        self.fields['citizenshipId'].choices = get_country_choices()

    def clean(self):
        username = self.cleaned_data.get('username')
        firstName = self.cleaned_data.get('firstName')
        lastName = self.cleaned_data.get('lastName')
        password = self.cleaned_data.get('password')
        confirmPassword = self.cleaned_data.get('confirmPassword')
        email = self.cleaned_data.get('email')
        confirmEmail = self.cleaned_data.get('confirmEmail')

        if username and firstName and lastName and password and confirmPassword and email and confirmEmail:

            valid, error_message = check_password_policy(self.cleaned_data,
                                                         password,
                                                         confirmPassword)
            if not valid:
                self.add_error('password', error_message)
                self.add_error('confirmPassword', '')
                raise forms.ValidationError(error_message)


            if email != confirmEmail:
                valid = False
                error_message = 'The email provided does not match the confirmation.'
            if not valid:
                self.add_error('email', error_message)
                self.add_error('confirmEmail', '')
                raise forms.ValidationError(error_message)

    def save(self, source='DesignSafe', pi_eligibility=INELIGIBLE):
        data = self.cleaned_data
        data['source'] = source
        data['piEligibility'] = pi_eligibility

        #pull out specific fields from data for tas and pro profile
        tas_keys = ['firstName', 'lastName','email', 'confirmEmail',
                    'phone', 'institutionId', 'institution',
                    'title', 'countryId', 'citizenshipId', 'ethnicity', 'gender',
                    'source', 'piEligibility', 'username', 'password', 'confirmPassword',
                    'agree_to_terms', 'agree_to_account_limit']
        pro_profile_fields = ['nh_interests', 'nh_interests_primary', 'nh_technical_domains', 'bio',
                                'website', 'orcid_id', 'professional_level', 'research_activities']
        pro_profile_data = {}
        tas_data = {}
        for key in data:
            if key in tas_keys:
                tas_data[key] = data[key]
            if key in pro_profile_fields:
                pro_profile_data[key] = data[key]

        safe_data = tas_data.copy()
        safe_data['password'] = safe_data['confirmPassword'] = '********'

        LOGGER.info('Attempting new user registration: %s' % safe_data)
        tas_user = TASClient().save_user(None, tas_data)

        # create local user
        UserModel = get_user_model()
        try:
            # the user should not exist
            user = UserModel.objects.get(username=data['username'])
            LOGGER.warning('On TAS registration, local user already existed? '
                           'user=%s' % user)
        except UserModel.DoesNotExist:
            user = UserModel.objects.create_user(
                username=data['username'],
                first_name=tas_user['firstName'],
                last_name=tas_user['lastName'],
                email=tas_user['email']
                )

        # extended profile information
        try:
            # again, this should not exist
            ds_profile = DesignSafeProfile.objects.get(user=user)
            ds_profile.ethnicity = data['ethnicity']
            ds_profile.gender = data['gender']
            ds_profile.bio = data['bio']
            ds_profile.website = data['website']
            ds_profile.orcid_id = data['orcid_id']
            ds_profile.professional_level = data['professional_level']
            ds_profile.update_required = False
        except DesignSafeProfile.DoesNotExist:
            ds_profile = DesignSafeProfile(
                user=user,
                ethnicity=data['ethnicity'],
                gender=data['gender'],
                bio=data['bio'],
                website=data['website'],
                orcid_id=data['orcid_id'],
                professional_level=data['professional_level'],
                update_required=False
                )
        ds_profile.save()

        #save professional profile information
        pro_profile = ProfessionalProfileForm(instance=ds_profile)
        pro_profile.cleaned_data = pro_profile_data
        pro_profile.save()

        # terms of use
        LOGGER.info('Prior to Registration, %s %s <%s> agreed to Terms of Use' % (
            data['firstName'], data['lastName'], data['email']))
        try:
            terms = TermsAndConditions.get_active()
            user_terms = UserTermsAndConditions(user=user, terms=terms)
            user_terms.save()
        except:
            LOGGER.exception('Error saving UserTermsAndConditions for user=%s', user)

        return tas_user

class NEESAccountMigrationForm(forms.Form):

    email_address = forms.EmailField(label=_('Your NEEShub Email Address'),
                                     help_text=_('Enter the email address associated '
                                                 'with your NEEShub account.'))


class NotificationPreferencesForm(forms.ModelForm):

    class Meta:
        model = NotificationPreferences
        exclude = ['user']

from django import forms
from django.conf import settings
from django.core.validators import validate_email
from captcha.fields import CaptchaField

# This was pulled from : https://docs.djangoproject.com/en/1.7/ref/forms/validation/
class MultiEmailField(forms.Field):
    def to_python(self, value):
        """ Normalize data to a list of strings. """

        # Return an empty list if no input was given.
        if not value:
            return []
        return value.split(',')

    def validate(self, value):
        """ Check if value consists only of valid emails. """

        # Use the parent's handling of required fields, etc.
        super(MultiEmailField, self).validate(value)

        for email in value:
            validate_email(email.strip())

class BaseTicketForm(forms.Form):
    """
    Base form class for Tickets.
    """
    first_name = forms.CharField(widget=forms.TextInput(), max_length=255, required=True)
    last_name = forms.CharField(widget=forms.TextInput(), max_length=255, required=True)
    email = forms.EmailField(widget=forms.EmailInput(), required=True)
    subject = forms.CharField(widget=forms.TextInput(), max_length=255, required=True)

    category_choices = (('', 'Choose one'),) + settings.TICKET_CATEGORIES
    category = forms.CharField(widget=forms.Select(choices=category_choices),
                               required=True)
    problem_description = forms.CharField(widget=forms.Textarea(), required=True)
    attachment = forms.FileField(required=False)

    error_page = forms.CharField(widget=forms.HiddenInput(), required=False)
    http_referer = forms.CharField(widget=forms.HiddenInput(), required=False)


class TicketForm(BaseTicketForm):
    """
    Authenticated users ticket form. Additional "CC" field. This field is not
    provided to anonymous users because it could be used for spam.
    """
    cc = MultiEmailField(widget=forms.TextInput(), label='CC', required=False,
                         help_text='You can copy other people on this ticket. '
                                   'Multiple emails should be comma-separated')

class TicketGuestForm(BaseTicketForm):
    """
    Anonymous users ticket form. Adds a CAPTCHA to reduce spam submissions.
    """
    captcha = CaptchaField()

class ReplyForm(forms.Form):
    """
    Ticket Reply form.
    """
    reply = forms.CharField(required=True, widget=forms.Textarea(), label="Enter Reply")
    attachment = forms.FileField(required=False)

class CloseForm(forms.Form):
    """
    Ticket Close form.
    """
    reply = forms.CharField(required=True, widget=forms.Textarea(), label="Enter Close Comment")

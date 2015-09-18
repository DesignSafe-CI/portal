from django import forms

class MeetingRequestForm(forms.Form):
    organizer_name = forms.CharField(required=True)
    organizer_email = forms.EmailField(required=True)
    meeting_topic = forms.CharField(required=True)
    meeting_date = forms.DateField(required=True)
    meeting_start = forms.TimeField(required=True)
    meeting_end = forms.TimeField(required=True)
    meeting_time_zone = forms.CharField(required=True)
    recurrence = forms.BooleanField(required=False)
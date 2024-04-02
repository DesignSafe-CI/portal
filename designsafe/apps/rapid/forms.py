from django import forms
from designsafe.apps.rapid.models import RapidNHEvent, RapidNHEventType
import logging


logger = logging.getLogger(__name__)


class RapidNHEventForm(forms.Form):

    event_date = forms.DateField(label="Date of hazard event", required=True)
    title = forms.CharField(label="Event Title")
    event_type = forms.ChoiceField(label="Hazard Event Type", required=True)
    location_description = forms.CharField(
        label="Brief location description", required=True
    )
    lat = forms.FloatField(label="Latitude", required=True)
    lon = forms.FloatField(label="Longitude", required=True)
    image = forms.FileField(label="Banner image for detail", required=False)

    # def clean(self):
    #     cleaned_data = self.cleaned_data
    #     self.location = {
    #         "lat": cleaned_data['lat'],
    #         "lon": cleaned_data['lon']
    #     }
    #     logger.info(self)


class RapidNHEventDatasetForm(forms.Form):
    url = forms.CharField(label="Link to Data Depot", required=True)
    title = forms.CharField(label="Brief description of dataset", required=True)
    doi = forms.CharField(label="DOI", required=False)

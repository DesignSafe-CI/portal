from django.forms import ModelForm

from designsafe.apps.workspace.models.app_entries import (
    AppVariant
)

class AppVariantForm(ModelForm):

  class Meta:
    model = AppVariant
    exclude = []

    help_texts = {'href': "The auto-generated address to app in the Apps Tray. Changes are reflected only after save.",}

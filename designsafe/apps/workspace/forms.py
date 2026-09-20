"""Admin forms for Tools & Applications pages."""

from django.forms import ModelForm

from designsafe.apps.workspace.models.app_entries import AppVariant
from designsafe.apps.workspace.models.app_cms_plugins import AppUserGuideLinkPlugin


class AppVariantForm(ModelForm):
    """Customizes app variant admin form"""

    class Meta:
        """To add or change help text"""

        model = AppVariant
        fields = []

        help_texts = {
            "href": (
                "The auto-generated path to the application. Changes are reflected"
                " only after save."
            ),
        }

class AppUserGuideLinkPluginForm(ModelForm):
    """Customizes app user guide link plugin admin form"""

    class Meta:
        """To add or change help text"""

        model = AppUserGuideLinkPlugin
        fields = '__all__'

        help_texts = {
            "app": (
                "If no app is selected, then app can be derived from URL path."
            ),
        }

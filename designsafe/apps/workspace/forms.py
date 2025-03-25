"""Admin forms for Tools & Applications pages."""

from django.forms import ModelForm

from designsafe.apps.workspace.models.app_entries import AppVariant


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

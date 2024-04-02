"""Models associated with CMS plugins for Tools & Applications"""

from cms.models.pluginmodel import CMSPlugin
from django.db import models
from designsafe.apps.workspace.models.app_entries import AppTrayCategory


class AppCategoryListingPlugin(CMSPlugin):
    """Model for listing apps by category."""

    app_category = models.ForeignKey(
        to=AppTrayCategory, on_delete=models.deletion.CASCADE
    )

    def __str__(self):
        return self.app_category.category

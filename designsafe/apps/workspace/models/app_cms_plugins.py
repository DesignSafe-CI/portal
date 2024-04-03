"""Models associated with CMS plugins for Tools & Applications"""

from cms.models.pluginmodel import CMSPlugin
from django.db import models
from designsafe.apps.workspace.models.app_entries import (
    AppTrayCategory,
    AppListingEntry,
)


class AppCategoryListingPlugin(CMSPlugin):
    """Model for listing apps by category."""

    app_category = models.ForeignKey(
        to=AppTrayCategory, on_delete=models.deletion.CASCADE
    )

    def __str__(self):
        return self.app_category.category


class RelatedAppsPlugin(CMSPlugin):
    """Model for listing related apps."""

    app = models.ForeignKey(to=AppListingEntry, on_delete=models.deletion.CASCADE)

    def __str__(self):
        return self.app.label


class AppVariantsPlugin(CMSPlugin):
    """Model for listing related apps."""

    app = models.ForeignKey(to=AppListingEntry, on_delete=models.deletion.CASCADE)

    def __str__(self):
        return self.app.label

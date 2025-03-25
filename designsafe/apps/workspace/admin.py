"""Admin layout for Tools & Applications workspace models.
"""

from django.contrib import admin
from django.db import models
from django.forms import CheckboxSelectMultiple

from designsafe.apps.workspace.forms import AppVariantForm
from designsafe.apps.workspace.models.app_descriptions import AppDescription
from designsafe.apps.workspace.models.app_entries import (
    AppListingEntry,
    AppVariant,
    AppTrayCategory,
    AppTag,
)

admin.site.register(AppDescription)
admin.site.register(AppTrayCategory)
admin.site.register(AppTag)


class AppVariantInline(admin.StackedInline):
    """Admin layout for app variants."""

    extra = 0
    model = AppVariant
    fk_name = "bundle"
    form = AppVariantForm

    readonly_fields = ["href"]

    def get_fieldsets(self, request, obj=None):
        return [
            (
                None,
                {
                    "fields": (
                        "app_type",
                        "app_id",
                    ),
                    "description": 'For the "App type" chosen, edit the corresponding set of fields below',
                },
            ),
            (
                "Tapis App",
                {
                    "fields": (
                        "version",
                        "href",
                    ),
                    "description": "Identifies the app version in the Workspace",
                },
            ),
            (
                "HTML or External app",
                {
                    "classes": ["collapse"],
                    "fields": ["external_href", "html",],
                    "description": "Defines link on CMS app page and display content in Workspace",
                },
            ),
            (
                "Display",
                {
                    "fields": (
                        "label",
                        "description",
                        "enabled",
                        "priority",
                    ),
                    "description": "Defines content display on CMS app list and in the Workspace app tray",
                },
            ),
        ]


@admin.register(AppListingEntry)
class AppTrayEntryAdmin(admin.ModelAdmin):
    """Admin layout for AppTrayEntry items."""

    class Media:
        css = {"all": ("styles/cms-form-styles.css",)}

    inlines = [AppVariantInline]

    def get_fieldsets(self, request, obj=None):
        default_fieldset = [
            (
                "Portal Display Options",
                {
                    "fields": [
                        "category",
                        "label",
                        "icon",
                        "user_guide_link",
                        "enabled",
                    ],
                },
            ),
        ]

        cms_fieldset = [
            (
                "CMS Display Options",
                {
                    "fields": [
                        "href",
                        "description",
                        "tags",
                        "is_popular",
                        "is_simcenter",
                        "license_type",
                        "related_apps",
                    ],
                },
            ),
        ]

        return default_fieldset + cms_fieldset

    formfield_overrides = {
        models.ManyToManyField: {"widget": CheckboxSelectMultiple},
    }

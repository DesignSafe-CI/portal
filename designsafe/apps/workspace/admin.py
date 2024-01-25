"""Admin layout for Tools & Applications workspace models.
"""

from django.contrib import admin
from django.db import models
from django.forms import CheckboxSelectMultiple
from designsafe.apps.workspace.models.app_descriptions import AppDescription
from designsafe.apps.workspace.models.app_entries import (
    AppTrayEntry,
    AppTrayCategory,
)

admin.site.register(AppDescription)
admin.site.register(AppTrayCategory)


@admin.register(AppTrayEntry)
class AppTrayEntryAdmin(admin.ModelAdmin):
    """Admin layout for AppTrayEntry items."""

    def get_fieldsets(self, request, obj=None):
        default_fieldset = [
            ("Tapis App Type", {"fields": ("app_type",)}),
            (
                "Display Options",
                {
                    "fields": [
                        "app_id",
                        "category",
                        "label",
                        "icon",
                        "available",
                    ],
                },
            ),
        ]
        tapis_fieldset = [
            (
                "Tapis App Specification for app_type: Tapis",
                {
                    "classes": ["collapse"],
                    "fields": ["version"],
                },
            ),
        ]

        html_fieldset = [
            (
                "HTML App Body for app_type: HTML",
                {
                    "classes": ["collapse"],
                    "fields": ["html"],
                },
            ),
        ]

        bundle_fieldset = [
            (
                "Bundled Apps",
                {
                    "classes": ["collapse"],
                    "fields": ["bundled_apps"],
                },
            )
        ]
        cms_fieldset = [
            (
                "CMS Display Options",
                {
                    "classes": ["collapse"],
                    "fields": [
                        "related_apps",
                        "popular",
                        "license_type",
                        "overview",
                    ],
                },
            ),
        ]

        if obj is not None:
            match obj.app_type:
                case "tapis":
                    return default_fieldset + tapis_fieldset + cms_fieldset
                case "html":
                    return default_fieldset + html_fieldset + cms_fieldset
                case "bundle":
                    return default_fieldset + bundle_fieldset + cms_fieldset

        return (
            default_fieldset
            + tapis_fieldset
            + html_fieldset
            + bundle_fieldset
            + cms_fieldset
        )

    formfield_overrides = {
        models.ManyToManyField: {"widget": CheckboxSelectMultiple},
    }

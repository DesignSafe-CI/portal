from django.contrib import admin
from django.db import models
from django.forms import CheckboxSelectMultiple
from designsafe.apps.workspace.models.app_descriptions import AppDescription
from designsafe.apps.workspace.models.app_entries import (
    AppItem,
    AppBundle,
    AppTrayCategory,
)

admin.site.register(AppDescription)


@admin.register(AppTrayCategory)
class AppTrayCategoryAdmin(admin.ModelAdmin):
    fields = (
        "category",
        "priority",
    )


@admin.register(AppItem)
class AppItemAdmin(admin.ModelAdmin):
    fieldsets = (
        ("Tapis App Type", {"fields": ("app_type",)}),
        (
            "Display Options",
            {
                "fields": (
                    "app_id",
                    "category",
                    "label",
                    "icon",
                    "available",
                ),
            },
        ),
        (
            "Tapis App Specification for app_type: Tapis",
            {
                "fields": ("version",),
            },
        ),
        (
            "HTML App Body for app_type: HTML",
            {
                "fields": ["html"],
            },
        ),
        (
            "CMS Display Options",
            {
                "fields": (
                    "related_apps",
                    "popular",
                    "license_type",
                    "overview",
                )
            },
        ),
    )
    formfield_overrides = {
        models.ManyToManyField: {"widget": CheckboxSelectMultiple},
    }


@admin.register(AppBundle)
class AppBundleAdmin(admin.ModelAdmin):
    fieldsets = (
        (
            "Display Options",
            {
                "fields": (
                    "app_id",
                    "category",
                    "label",
                    "icon",
                    "available",
                ),
            },
        ),
        (
            "Bundled Apps",
            {
                "fields": ("bundled_apps",),
            },
        ),
        (
            "CMS Display Options",
            {
                "fields": (
                    "related_apps",
                    "popular",
                    "license_type",
                    "overview",
                )
            },
        ),
    )
    formfield_overrides = {
        models.ManyToManyField: {"widget": CheckboxSelectMultiple},
    }

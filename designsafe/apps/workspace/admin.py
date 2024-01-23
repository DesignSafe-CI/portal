from django.contrib import admin
from django.db import models
from django.forms import CheckboxSelectMultiple
from designsafe.apps.workspace.models.app_descriptions import AppDescription
from designsafe.apps.workspace.models.app_entries import (
    AppItem,
    AppBundle,
    AppTrayCategory
)

admin.site.register(AppDescription)

@admin.register(AppTrayCategory)
class AppTrayCategoryAdmin(admin.ModelAdmin):
    fields = ('category', 'priority', )


@admin.register(AppItem)
class AppItemAdmin(admin.ModelAdmin):
    fieldsets = (
        ('Display Options', {
            'fields': (
                'label',
                'icon',
                'category',
                'available',
                'appId',
            ),
        }),
        ('CMS Display Options', {
            'fields': (
                'relatedApps',
                'popular',
                'licenseType',
                'overview',
            )
        }),
        ('Tapis App Type', {
            'fields': (
                'appType',
            )
        }),
        ('Tapis App Specification for appType: Tapis', {
            'fields': (
                'version',
            ),
        }),
        ('HTML App Body for appType: HTML', {
            'fields': ['html'],
        }),
    )
    formfield_overrides = {
        models.ManyToManyField: {'widget': CheckboxSelectMultiple},
    }


@admin.register(AppBundle)
class AppBundleAdmin(admin.ModelAdmin):
    fieldsets = (
        ('Display Options', {
            'fields': (
                'label',
                'icon',
                'category',
                'available',
                'appId',
            ),
        }),
        ('CMS Display Options', {
            'fields': (
                'relatedApps',
                'popular',
                'licenseType',
                'overview',
            )
        }),
        ('Bundled Apps', {
            'fields': (
                'bundledApps',
            ),
        }),
    )
    formfield_overrides = {
        models.ManyToManyField: {'widget': CheckboxSelectMultiple},
    }

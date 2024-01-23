from django.contrib import admin
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


class AppTrayEntryAdmin(admin.ModelAdmin):
    fieldsets = (
        ('Display Options', {
            'fields': (
                'label',
                'icon',
                'category',
                'relatedApps'
                'popular'
                'licenseType'
                'overview',
                'available'
                'appId',
                'appType',
            )
        }),
    )


@admin.register(AppItem)
class AppItemAdmin(AppTrayEntryAdmin):
    def __init__(self):
        self.fieldsets = self.fieldsets + (
            ('Tapis App Specification', {
                'fields': (
                    'version',
                )
            }),
            ('HTML App Body', {
                'fields': ['html']
            }),
        )


@admin.register(AppBundle)
class AppBundleAdmin(AppTrayEntryAdmin):
    def __init__(self):
        self.fieldsets = self.fieldsets + (
            ('Bundled Apps', {
                'fields': (
                    'bundledApps',
                )
            }),
        )

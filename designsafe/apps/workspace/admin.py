from django.contrib import admin
from designsafe.apps.workspace.models.app_descriptions import AppDescription
from designsafe.apps.workspace.models.app_entries import (
    AppTrayEntry,
    AppTrayCategory
)

admin.site.register(AppDescription)

@admin.register(AppTrayCategory)
class AppTrayCategoryAdmin(admin.ModelAdmin):
    fields = ('category', 'priority', )


@admin.register(AppTrayEntry)
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
                'appType',
                'appId',
            )
        }),
        ('Tapis App Specification', {
            'fields': (
                'version',
            )
        }),
        ('HTML App Body', {
            'fields': ['html']
        })
    )

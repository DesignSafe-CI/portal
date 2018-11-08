from django.contrib import admin
import designsafe.apps.workspace.models as models


@admin.register(models.AppDescription)
class AppDescriptionAdmin(admin.ModelAdmin):
    pass

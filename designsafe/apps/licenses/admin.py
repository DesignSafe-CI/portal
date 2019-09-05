from django.contrib import admin
from . import models


@admin.register(models.MATLABLicense)
class MATLABLicenseAdmin(admin.ModelAdmin):
    readonly_fields = ('license_type', )

@admin.register(models.LSDYNALicense)
class LSDYNALicenseAdmin(admin.ModelAdmin):
    readonly_fields = ('license_type', )

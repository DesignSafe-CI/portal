"""AppConfig for the audit app."""

from django.apps import AppConfig


class AuditConfig(AppConfig):
    """Configuration for the DesignSafe Audit Trail app."""

    # default_auto_field = 'django.db.models.BigAutoField'
    name = "designsafe.apps.audit"
    label = "designsafe_audit"
    verbose_name = "DesignSafe Audit Trail"

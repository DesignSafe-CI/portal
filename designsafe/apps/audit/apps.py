from django.apps import AppConfig


class AuditConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'designsafe.apps.audit'
    label = 'designsafe_audit'
    verbose_name = 'DesignSafe Audit Trail' 
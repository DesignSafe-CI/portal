from django.apps import AppConfig


class WebhookConfig(AppConfig):
    name = "designsafe.apps.webhooks"
    label = "webhooks"
    verbose_name = "DesignSafe Webhooks"
    app_label = "webhooks"

"""Webhooks app config"""

from django.apps import AppConfig


class WebhookConfig(AppConfig):
    """Webhook config."""

    name = "designsafe.apps.webhooks"
    label = "webhooks"
    verbose_name = "DesignSafe Webhooks"
    app_label = "webhooks"

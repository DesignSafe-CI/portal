from django.apps import AppConfig


class NotificationsConfig(AppConfig):
    name = 'designsafe.apps.api.notifications'
    label = 'notifications_api'
    verbose_name = 'Designsafe Notifications'

    def ready(self):
        from designsafe.apps.api.notifications.receivers import (send_notification_ws, send_broadcast_ws)  # noqa: F401

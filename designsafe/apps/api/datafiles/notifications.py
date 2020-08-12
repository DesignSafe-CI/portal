from designsafe.apps.api.notifications.models import Notification


def notify(username, operation, message, status, extra):
    event_data = {
        Notification.EVENT_TYPE: 'data_depot',
        Notification.STATUS: status,
        Notification.USER: username,
        Notification.MESSAGE: message,
        Notification.EXTRA: extra
    }
    Notification.objects.create(**event_data)

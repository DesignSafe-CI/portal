"""Api notifications urls."""
from django.urls import path, re_path

from designsafe.apps.api.notifications.views.api import ManageNotificationsView, NotificationsBadgeView
from designsafe.apps.api.notifications.views.webhooks import JobsWebhookView, FilesWebhookView

app_name = "notifications_api"
urlpatterns = [
    path('badge/', NotificationsBadgeView.as_view(), name='badge'),
    re_path(r'^notifications/(?P<event_type>\w+)/?$', ManageNotificationsView.as_view(),
            name='event_type_notifications'),
    re_path(r'^delete/(?P<pk>\w+)?$', ManageNotificationsView.as_view(),
            name='delete_notification'),
    path('wh/jobs/', JobsWebhookView.as_view(), name='jobs_wh_handler'),
    path('wh/files/', FilesWebhookView.as_view(), name='files_wh_handler'),
    path('', ManageNotificationsView.as_view(), name='index'),
]

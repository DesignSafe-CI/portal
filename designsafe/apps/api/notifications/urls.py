from django.conf.urls import include, url, patterns

from designsafe.apps.api.notifications.views.api import ManageNotificationsView, NotificationsBadgeView
from designsafe.apps.api.notifications.views.webhooks import JobsWebhookView, FilesWebhookView

urlpatterns = patterns('designsafe.apps.notifications.views.api',
    url(r'^$', ManageNotificationsView.as_view(), name='index'),
    url(r'^badge/$', NotificationsBadgeView.as_view(), name='badge'),
    url(r'^notifications/(?P<event_type>\w+)/?$', ManageNotificationsView.as_view(), name='event_type_notifications'),
    url(r'^delete/(?P<pk>\w+)?$', ManageNotificationsView.as_view(),
                                        name='delete_notification'),
)

urlpatterns += patterns('designsafe.apps.notifications.views.webhooks',
    url(r'^wh/jobs/$', JobsWebhookView.as_view(), name='jobs_wh_handler'),
    url(r'^wh/files/$', FilesWebhookView.as_view(), name='files_wh_handler'),
)

from django.urls import re_path as url

from designsafe.apps.api.notifications.views.api import ManageNotificationsView, NotificationsBadgeView

urlpatterns = [
    url(r'^$', ManageNotificationsView.as_view(), name='index'),
    url(r'^badge/$', NotificationsBadgeView.as_view(), name='badge'),
    url(r'^notifications/(?P<event_type>\w+)/?$', ManageNotificationsView.as_view(), name='event_type_notifications'),
    url(r'^delete/(?P<pk>\w+)?$', ManageNotificationsView.as_view(),
                                        name='delete_notification'),
]

"""
DesignSafe-CI Webhook URLs
"""
from django.conf import settings
from django.conf.urls import include, url, patterns

urlpatterns = patterns(
    '',
    url(r'box/$', 'designsafe.apps.box_integration.webhooks.box_webhook'),
    url(r'jobs/$', 'designsafe.apps.notifications.views.job_notification_handler', name='jobs_webhook'),
)

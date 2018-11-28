"""
DesignSafe-CI Webhook URLs
"""
from django.conf import settings
from django.conf.urls import include, url
from designsafe.apps.notifications import views
from designsafe.apps.box_integration import webhooks

urlpatterns = [
    url(r'^$', views.generic_webhook_handler, name='interactive_wh_handler'),
    url(r'^box/$', webhooks.box_webhook),
]

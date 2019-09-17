"""
DesignSafe-CI Webhook URLs
"""
from django.conf import settings
from django.urls import include, path
from designsafe.apps.notifications import views
from designsafe.apps.box_integration import webhooks

urlpatterns = [
    path('box/', webhooks.box_webhook),
    path('', views.generic_webhook_handler, name='interactive_wh_handler'),
]

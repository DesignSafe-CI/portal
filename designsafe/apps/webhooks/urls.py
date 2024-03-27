"""Webhooks URLs
"""

from django.urls import path
from designsafe.apps.webhooks import views


app_name = "webhooks"
urlpatterns = [
    path("jobs/", views.JobsWebhookView.as_view(), name="jobs_wh_handler"),
    path(
        "interactive/",
        views.InteractiveWebhookView.as_view(),
        name="interactive_wh_handler",
    ),
]

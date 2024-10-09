"""URLs for the Onboarding app."""

from django.urls import re_path
from designsafe.apps.onboarding.views import OnboardingView

app_name = "workbench"
urlpatterns = [
    re_path("^", OnboardingView.as_view(), name="onboarding"),
]

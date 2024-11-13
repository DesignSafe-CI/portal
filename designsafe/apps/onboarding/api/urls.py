""" URL routing for the onboarding API. """

from django.urls import path
from designsafe.apps.onboarding.api import views


app_name = "onboarding_api"
urlpatterns = [
    path("user/", views.SetupStepView.as_view(), name="user_self_view"),
    path("user/<str:username>/", views.SetupStepView.as_view(), name="user_view"),
    path("admin/", views.SetupAdminView.as_view(), name="user_admin"),
]

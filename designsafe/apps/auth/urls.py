"""
.. module:: designsafe.apps.auth.urls
   :synopsis: Auth URLs
"""

from django.urls import path
from designsafe.apps.auth import views

app_name = "designsafe_auth"
urlpatterns = [
    path("", views.tapis_oauth, name="login"),
    path("logged-out/", views.logged_out, name="logout"),
    path("tapis/", views.tapis_oauth, name="tapis_oauth"),
    path("tapis/callback/", views.tapis_oauth_callback, name="tapis_oauth_callback"),
]

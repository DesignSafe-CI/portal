"""Auth urls."""
from django.conf.urls import path
from designsafe.apps.auth import views

urlpatterns = [
    path('logged-out/', views.logged_out, name='logout'),
    path('agave/', views.agave_oauth, name='agave_oauth'),
    path('agave/callback/', views.agave_oauth_callback, name='agave_oauth_callback'),
    path('agave/session-error/', views.agave_session_error, name='agave_session_error'),
    path('', views.login_options, name='login'),
]

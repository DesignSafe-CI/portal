"""Dropbox Integration urls."""
from django.urls import path
from designsafe.apps.dropbox_integration import views

app_name = "dropbox_integration"
urlpatterns = [
    path('initialize/', views.initialize_token, name='initialize_token'),
    path('oauth2/', views.oauth2_callback, name='oauth2_callback'),
    path('disconnect/', views.disconnect, name='disconnect'),
    path('', views.index, name='index'),
]

"""Notifications urls."""

from django.urls import path
from designsafe.apps.notifications import views

app_name = "notifications"
urlpatterns = [
    path('notifications/', views.notifications, name='notifications'),
    path('', views.index, name='index'),
]

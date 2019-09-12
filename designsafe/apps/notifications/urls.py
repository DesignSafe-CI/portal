"""Notifications urls."""

from django.conf.urls import path
from designsafe.apps.notifications import views


urlpatterns = [
    path('notifications/', views.notifications, name='notifications'),
    path('', views.index, name='index'),
]

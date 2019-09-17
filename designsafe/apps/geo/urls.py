"""Geo urls."""

from django.urls import path, reverse
from designsafe.apps.geo import views

urlpatterns = [
    path('test/', views.test, name='test'),
    path('', views.index, name='index'),

]

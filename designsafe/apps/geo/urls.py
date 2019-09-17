"""Geo urls."""

from django.conf.urls import path
from django.urls import reverse
from designsafe.apps.geo import views

urlpatterns = [
    path('test/', views.test, name='test'),
    path('', views.index, name='index'),

]

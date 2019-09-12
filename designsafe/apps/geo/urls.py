"""Geo urls."""

from django.conf.urls import path
from django.core.urlresolvers import reverse
from designsafe.apps.geo import views

urlpatterns = [
    path('test/', views.test, name='test'),
    path('', views.index, name='index'),

]

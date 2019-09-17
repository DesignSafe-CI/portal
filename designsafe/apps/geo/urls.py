"""Geo urls."""

from django.urls import path, reverse
from designsafe.apps.geo import views

app_name = "geo"
urlpatterns = [
    path('test/', views.test, name='test'),
    path('', views.index, name='index'),

]

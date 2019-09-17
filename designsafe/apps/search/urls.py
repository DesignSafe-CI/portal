"""Search urls."""

from django.urls import path
from designsafe.apps.search import views

urlpatterns = [
    path('', views.index, name='index'),
]

"""Dashboard urls."""
from django.conf.urls import path
from designsafe.apps.dashboard import views

urlpatterns = [
    path('', views.index, name='index'),
]

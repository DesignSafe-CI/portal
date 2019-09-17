"""Dashboard urls."""
from django.urls import path
from designsafe.apps.dashboard import views

urlpatterns = [
    path('', views.index, name='index'),
]

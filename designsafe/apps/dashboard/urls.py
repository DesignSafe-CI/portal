"""Dashboard urls."""
from django.urls import path
from designsafe.apps.dashboard import views

app_name = "dashboard"
urlpatterns = [
    path('', views.index, name='index'),
]

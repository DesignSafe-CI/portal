"""Search urls."""

from django.urls import path
from designsafe.apps.search import views

app_name = "ds_search"
urlpatterns = [
    path('', views.index, name='index'),
]

"""Applications urls."""

from django.urls import path, re_path
from designsafe.apps.applications import views

app_name = "ds_applications"
urlpatterns = [
    re_path(r'^api/(?P<service>[a-z]+?)/$', views.call_api, name='call_api'),
    path('', views.index, name='index'),
]

from django.urls import re_path as url

from designsafe.apps.dashboard import views

urlpatterns = [
    url(r'^$', views.index, name='index'),
]

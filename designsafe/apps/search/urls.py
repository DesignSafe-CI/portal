from django.urls import re_path as url

from designsafe.apps.search import views

urlpatterns = [
    url(r'', views.index, name='index'),
]

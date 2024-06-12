from django.urls import include, re_path as url
from django.urls import reverse
from django.utils.translation import gettext_lazy as _
from designsafe.apps.applications import views


urlpatterns = [
    url(r'^$', views.index, name='index'),
    url(r'^api/(?P<service>[a-z]+?)/$', views.call_api, name='call_api'),
]

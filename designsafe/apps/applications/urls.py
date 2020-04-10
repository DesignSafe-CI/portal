from django.conf.urls import url
from designsafe.apps.applications import views


urlpatterns = [
    url(r'^$', views.index, name='index'),
    url(r'^api/(?P<service>[a-z]+?)/$', views.call_api, name='call_api'),
]

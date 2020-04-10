from django.conf.urls import url
from designsafe.apps.geo import views

urlpatterns = [
    url(r'^$', views.index, name='index'),
    url(r'^test/$', views.test, name='test'),
    url(r'^.*$', views.index, name="index"),

]

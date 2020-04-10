from django.conf.urls import url
from designsafe.apps.dashboard import views

urlpatterns = [
    url(r'^$', views.index, name='index'),
]

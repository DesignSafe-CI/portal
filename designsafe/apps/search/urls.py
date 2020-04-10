from django.conf.urls import url
from designsafe.apps.search import views

urlpatterns = [
    url(r'', views.index, name='index'),
]

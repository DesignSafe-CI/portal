from django.conf.urls import url
from designsafe.apps.dropbox_integration import views

urlpatterns = [
    url(r'^$', views.index, name='index'),
    url(r'^initialize/$', views.initialize_token, name='initialize_token'),
    url(r'^oauth2/$', views.oauth2_callback, name='oauth2_callback'),
    url(r'^disconnect/$', views.disconnect, name='disconnect'),
]

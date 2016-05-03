from django.conf.urls import patterns, url
from designsafe.apps.box_integration.views import BoxFilesView, BoxFilesJsonView

urlpatterns = patterns(
    'designsafe.apps.box_integration.views',
    url(r'^$', 'index', name='index'),
    url(r'^initialize/$', 'initialize_token', name='initialize_token'),
    url(r'^oauth2/$', 'oauth2_callback', name='oauth2_callback'),
    url(r'^disconnect/$', 'disconnect', name='disconnect'),
    url(r'^files/$', BoxFilesView.as_view(), name='files'),
    url(r'^files/(?P<path>.+)/$', BoxFilesView.as_view(), name='files'),
    url(r'^api/(?P<item_type>\w+)/(?P<item_id>\d+).json$', BoxFilesJsonView.as_view(),
        name='box_api'),
)

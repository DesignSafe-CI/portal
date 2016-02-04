from django.conf.urls import patterns, url


urlpatterns = patterns(
    'designsafe.apps.box_integration.views',
    url(r'^$', 'index', name='index'),
    url(r'^initialize/$', 'initialize_token', name='initialize_token'),
    url(r'^oauth2/$', 'oauth2_callback', name='oauth2_callback'),
    url(r'^disconnect/$', 'disconnect', name='disconnect'),
)

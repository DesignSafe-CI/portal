from django.conf.urls import patterns, include, url

urlpatterns = patterns('designsafe.apps.meetings.views',
    url(r'^request/', 'meeting_request', name='meeting_request'),
)
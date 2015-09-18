from django.conf.urls import patterns, include, url

urlpatterns = patterns('',
    url(r'^request/', 'meetings.views.meeting_request', name='meeting_request'),
)
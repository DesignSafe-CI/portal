from django.conf.urls import patterns, include, url
from django.core.urlresolvers import reverse

urlpatterns = patterns(
    'designsafe.apps.rapid.views',
    url(r'^event-types/?$', 'get_event_types', name="get_event_types"),
    url(r'^events/?$', 'get_events', name="get_events"),
    url(r'^admin/?$', 'admin', name="admin"),
    url(r'^admin/create-event', 'admin_create_event', name="admin_create_event"),
    url(r'^admin/edit-event/(?P<event_id>\w)/$', 'admin_edit_event', name="admin_edit_event"),
    url(r'^.*$', 'index', name='index'),

)

from django.conf.urls import patterns, include, url
from django.core.urlresolvers import reverse

urlpatterns = patterns(
    'designsafe.apps.rapid.views',
    url(r'^event-types/?$', 'get_event_types', name="get_event_types"),
    url(r'^events/?$', 'get_events', name="get_events"),
    url(r'^admin/?$', 'admin', name="admin"),
    url(r'^admin/create-event', 'admin_create_event', name="admin_create_event"),
    url(r'^admin/events/(?P<event_id>[-\w]+)/$', 'admin_edit_event', name="admin_edit_event"),
    url(r'^admin/events/(?P<event_id>[-\w]+)/add-dataset$', 'admin_event_add_dataset', name="admin_event_add_dataset"),
    url(r'^admin/events/(?P<event_id>[-\w]+)/(?P<dataset_id>[-\w]+)$', 'admin_event_edit_dataset', name="admin_event_edit_dataset"),
    url(r'^.*$', 'index', name='index'),

)

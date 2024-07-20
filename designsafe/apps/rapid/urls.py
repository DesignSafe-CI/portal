from django.urls import include, re_path as url, path
from django.urls import reverse
from designsafe.apps.rapid import views

urlpatterns = [
    url(r'^event-types/?$', views.get_event_types, name="get_event_types"),
    url(r'^events/?$', views.get_events, name="get_events"),
    url(r'^admin/?$', views.admin, name="admin"),
    url(r'^admin/users/?$', views.admin_users, name="admin_users"),
    url(r'^admin/users/permissions/?$', views.admin_user_permissions, name="admin_user_permissions"),
    url(r'^admin/create-event', views.admin_create_event, name="admin_create_event"),
    url(r'^admin/events/(?P<event_id>[-\w]+)/delete$', views.admin_delete_event, name="admin_delete_event"),
    url(r'^admin/events/(?P<event_id>[-\w]+)/$', views.admin_edit_event, name="admin_edit_event"),
    url(r'^admin/events/(?P<event_id>[-\w]+)/datasets$', views.admin_event_datasets, name="admin_event_datasets"),
    url(r'^admin/events/(?P<event_id>[-\w]+)/add-dataset/$', views.admin_event_add_dataset, name="admin_event_add_dataset"),
    url(r'^admin/events/(?P<event_id>[-\w]+)/(?P<dataset_id>[-\w]+)/$', views.admin_event_edit_dataset, name="admin_event_edit_dataset"),
    url(r'^admin/events/(?P<event_id>[-\w]+)/(?P<dataset_id>[-\w]+)/delete$', views.admin_event_delete_dataset, name="admin_event_delete_dataset"),
    url(r'^proxy/', views.proxy_request, name='proxy_request'),
    url(r'^.*$', views.index, name='index'),

]

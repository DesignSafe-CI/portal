"""Rapid URLS."""
from django.conf.urls import path, re_path
from designsafe.apps.rapid import views

urlpatterns = [
    path('event-types/', views.get_event_types, name="get_event_types"),
    path('events/', views.get_events, name="get_events"),
    path('admin/', views.admin, name="admin"),
    path('admin/users/', views.admin_users, name="admin_users"),
    path('admin/users/permissions/', views.admin_user_permissions, name="admin_user_permissions"),
    path('admin/create-event', views.admin_create_event, name="admin_create_event"),
    re_path(r'^admin/events/(?P<event_id>[-\w]+)/delete$', views.admin_delete_event, name="admin_delete_event"),
    re_path(r'^admin/events/(?P<event_id>[-\w]+)/$', views.admin_edit_event, name="admin_edit_event"),
    re_path(r'^admin/events/(?P<event_id>[-\w]+)/datasets$', views.admin_event_datasets, name="admin_event_datasets"),
    re_path(r'^admin/events/(?P<event_id>[-\w]+)/add-dataset/$', views.admin_event_add_dataset,
            name="admin_event_add_dataset"),
    re_path(r'^admin/events/(?P<event_id>[-\w]+)/(?P<dataset_id>[-\w]+)/$', views.admin_event_edit_dataset,
            name="admin_event_edit_dataset"),
    re_path(r'^admin/events/(?P<event_id>[-\w]+)/(?P<dataset_id>[-\w]+)/delete$', views.admin_event_delete_dataset,
            name="admin_event_delete_dataset"),
    re_path('^.*$', views.index, name='index'),

]

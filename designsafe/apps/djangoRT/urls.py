"""DjangoRT urls."""
from django.urls import path, re_path

from designsafe.apps.djangoRT import views

urlpatterns = [
    path('new-ticket/', views.ticketcreate, name='ticketcreate'),
    path('tickets/', views.mytickets, name='mytickets'),
    re_path(r'^tickets/(?P<ticketId>\d+)/$', views.ticketdetail, name='ticketdetail'),
    re_path(r'^tickets/(?P<ticketId>\d+)/reply/$', views.ticketreply, name='ticketreply'),
    re_path(r'^tickets/(?P<ticketId>\d+)/close/$', views.ticketclose, name='ticketclose'),
    re_path(r'^tickets/(?P<ticketId>\d+)/attachment/(?P<attachmentId>\d+)/$',
            views.ticketattachment, name='ticketattachment'),
    path('', views.index, name='index'),
]

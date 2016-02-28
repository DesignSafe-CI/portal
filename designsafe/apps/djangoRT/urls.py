from django.conf.urls import patterns, url

from designsafe.apps.djangoRT import views

urlpatterns = patterns('',
    url(r'^$', views.index, name='index'),
    url(r'^new-ticket/$', views.ticketcreate, name='ticketcreate'),
    # url(r'^new-ticket/guest/$', views.ticketcreateguest, name='ticketcreateguest'),
    url(r'^tickets/$', views.mytickets, name='mytickets'),
    url(r'^tickets/(?P<ticketId>\d+)/$', views.ticketdetail, name='ticketdetail'),
    url(r'^tickets/(?P<ticketId>\d+)/reply/$', views.ticketreply, name='ticketreply'),
    url(r'^tickets/(?P<ticketId>\d+)/close/$', views.ticketclose, name='ticketclose'),
    url(r'^tickets/(?P<ticketId>\d+)/attachment/(?P<attachmentId>\d+)/$', views.ticketattachment, name='ticketattachment'),
)

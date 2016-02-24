from django.conf.urls import patterns, url

from designsafe.apps.djangoRT import views

urlpatterns = patterns('',
    url(r'^$', views.index, name='index'),
    url(r'^mytickets/$', views.mytickets, name='mytickets'),
    url(r'^ticket/(?P<ticketId>\d+)/$', views.ticketdetail, name='ticketdetail'),
    url(r'^ticket/new/$', views.ticketcreate, name='ticketcreate'),
    url(r'^ticket/reply/(?P<ticketId>\d+)/$', views.ticketreply, name='ticketreply'),
    url(r'^ticket/new/guest/$', views.ticketcreateguest, name='ticketcreateguest'),
    url(r'^ticket/close/(?P<ticketId>\d+)/$', views.ticketclose, name='ticketclose'),
    url(r'^ticket/attachment/(?P<ticketId>\d+)/(?P<attachmentId>\d+)/$', views.ticketattachment, name='ticketattachment'),
)

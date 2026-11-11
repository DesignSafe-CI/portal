from django.urls import re_path as url

from designsafe.apps.djangoRT import views

urlpatterns = [
    url(r"^$", views.index, name="index"),
    url(r"^new-ticket/$", views.ticketcreate, name="ticketcreate"),
    # url(r'^new-ticket/guest/$', views.ticketcreateguest, name='ticketcreateguest'),
    url(r"^tickets/$", views.mytickets, name="mytickets"),
    url(r"^tickets/(?P<ticketId>\d+)/$", views.ticketdetail, name="ticketdetail"),
    url(r"^tickets/(?P<ticketId>\d+)/reply/$", views.ticketreply, name="ticketreply"),
    url(r"^tickets/(?P<ticketId>\d+)/close/$", views.ticketclose, name="ticketclose"),
    url(
        r"^tickets/(?P<ticketId>\d+)/attachment/(?P<attachmentId>\d+)/$",
        views.ticketattachment,
        name="ticketattachment",
    ),
    url(r"^feedback/$", views.FeedbackView.as_view(), name="feedback"),
]

from django.urls import re_path as url
from designsafe.apps.audit import views

urlpatterns = [
    url(r'^$', views.audit_trail, name='audit_trail'),
] 
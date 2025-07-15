"""URL configuration for the audit app."""
from django.urls import path
from designsafe.apps.audit import views

urlpatterns = [
    path('', views.audit_trail, name='audit_trail'),
    path('api/user/<str:username>/portal/', views.get_portal_audit_search, name='get_portal_audit_search'),
    path('api/user/<str:filename>/tapis/', views.get_tapis_files_audit_search, name='get_tapis_files_audit_search'),
    path('api/usernames/portal/', views.get_usernames_portal, name='get_usernames_portal'),
] 
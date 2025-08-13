"""URL configuration for the audit app."""
from django.urls import path
from designsafe.apps.audit import views

urlpatterns = [
    path("", views.audit_trail, name="audit_trail"),
    path(
        "api/user/<str:username>/portal/",
        views.get_portal_session_audit_search,
        name="get_portal_session_audit_search",
    ),
    path(
        "api/file/<path:filename>/portal/",
        views.get_portal_file_audit_search,
        name="get_portal_file_audit_search",
    ),
    path(
        "api/file/<str:filename>/tapis/",
        views.get_tapis_file_audit_search,
        name="get_tapis_file_audit_search",
    ),
    path(
        "api/usernames/portal/", views.get_usernames_portal, name="get_usernames_portal"
    ),
]

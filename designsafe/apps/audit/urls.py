from django.urls import path
from designsafe.apps.audit import views

urlpatterns = [
    path('', views.audit_trail, name='audit_trail'),
    path('api/user/<str:username>/last-session/', views.get_audit_user_last_session, name='get_audit_user_last_session'),
    path('api/usernames/portals/', views.get_usernames_portals, name='get_usernames_portals'),
] 

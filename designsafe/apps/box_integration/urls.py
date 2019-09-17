"""Box integration urls."""
from django.urls import path
from designsafe.apps.box_integration import views

urlpatterns = [
    path('initialize/', views.initialize_token, name='initialize_token'),
    path('oauth2/', views.oauth2_callback, name='oauth2_callback'),
    path('disconnect/', views.disconnect, name='disconnect'),
    path('', views.index, name='index'),
]

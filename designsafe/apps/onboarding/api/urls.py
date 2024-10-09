"""
.. :module:: apps.accounts.api.urls
   :synopsis: Manager handling anything pertaining to accounts
"""
from django.urls import path
from portal.apps.onboarding.api import views


app_name = 'portal_onboarding_api'
urlpatterns = [
    path('user/', views.SetupStepView.as_view(), name='user_self_view'),
    path('user/<str:username>/', views.SetupStepView.as_view(), name='user_view'),
    path('admin/', views.SetupAdminView.as_view(), name='user_admin')
]

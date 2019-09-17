"""api users urls."""
from django.urls import path
from designsafe.apps.api.users.views import SearchView, AuthenticatedView, UsageView, PublicView

urlpatterns = [
    path('auth/', AuthenticatedView.as_view(), name='user_authenticated'),
    path('usage/', UsageView.as_view(), name='user_usage'),
    path('public/', PublicView.as_view(), name='user_public'),
    path('', SearchView.as_view(), name='user_search'),
]

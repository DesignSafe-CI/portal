"""Nco urls."""
from django.urls import path
from designsafe.apps.nco.views import NcoIndexView

urlpatterns = [
    path('', NcoIndexView.as_view(
        template_name='designsafe/apps/nco/nco_index.html'
    ), name='index')
]

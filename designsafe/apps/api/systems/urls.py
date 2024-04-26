"""Publication API routes"""

from django.urls import path
from .views import SystemKeysView

urlpatterns = [
    path("", SystemKeysView.as_view()),
]

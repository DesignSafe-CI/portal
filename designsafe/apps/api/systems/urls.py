"""Publication API routes"""

from django.urls import path
from .views import SystemKeysView

urlpatterns = [
    path("keys/<str:operation>/", SystemKeysView.as_view()),
]

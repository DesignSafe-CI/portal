"""File Meta API routes"""

from django.urls import path
from designsafe.apps.api.filemeta.views import FileMetaView

urlpatterns = [
    path("<str:system_id>/<path:path>/", FileMetaView.as_view()),
]

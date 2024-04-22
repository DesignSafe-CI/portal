"""File Meta API routes"""

from django.urls import path
from .views import FileMetaView, CreateFileMetaView

urlpatterns = [
    path("<str:system_id>/<path:path>", FileMetaView.as_view(), name="filemeta-get"),
    path("", CreateFileMetaView.as_view(), name="filemeta-create"),
]

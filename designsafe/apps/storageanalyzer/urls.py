from django.conf.urls import url
from . import views

urlpatterns = [
    url(r'^api/storage/analyze/$', views.analyze_storage, name='analyze-storage'),
    url(r'^api/storage/archive/$', views.archive_files, name='archive-files'),
]

from django.conf.urls import url
from designsafe.apps.nco.views import ProjectsListView

urlpatterns = [
    url(r'projects', ProjectsListView.as_view(), name='projects_list')
]

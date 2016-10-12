from django.conf.urls import url
from designsafe.apps.api.users.views import SearchView

urlpatterns = [
    url(r'^$', SearchView.as_view(), name='user_search'),
]

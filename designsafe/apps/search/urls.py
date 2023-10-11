from django.conf.urls import include, url
from django.urls import reverse
from django.utils.translation import ugettext_lazy as _
from designsafe.apps.search import views

urlpatterns = [
    url(r'', views.index, name='index'),
]

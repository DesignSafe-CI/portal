from django.conf.urls import include, url, patterns

urlpatterns = patterns('',

    #data
    url(r'^data/', include('designsafe.apps.api.data.urls')),
)

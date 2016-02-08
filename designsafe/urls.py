"""
DesignSafe-CI URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/1.8/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  url(r'^$', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  url(r'^$', Home.as_view(), name='home')
Including another URLconf
    1. Add an import:  from blog import urls as blog_urls
    2. Add a URL to urlpatterns:  url(r'^blog/', include(blog_urls))
"""
from django.conf import settings
from django.conf.urls import include, url, patterns
from django.conf.urls.static import static
from django.contrib import admin

urlpatterns = patterns('',

    # admin
    url(r'^admin/', include(admin.site.urls)),
    url(r'^admin/impersonate/', include('impersonate.urls')),

    # api urls, just for the samples.
    url(r'^data/', include('designsafe.apps.data.urls')),
    url(r'^workspace/', include('designsafe.apps.workspace.urls', namespace='designsafe_workspace')),
    url(r'^user_activity/', include('designsafe.apps.user_activity.urls')),
    url(r'^notifications/', include('designsafe.apps.notifications.urls')),

    # auth
    url(r'^account/', include('designsafe.apps.accounts.urls',
        namespace='designsafe_accounts')),
    url(r'^account/applications/box/', include('designsafe.apps.box_integration.urls',
        namespace='box_integration')),
    url(r'^auth/', include('designsafe.apps.auth.urls', namespace='designsafe_auth')),
    url(r'^login/$', 'designsafe.apps.auth.views.login_options', name='login'),
    url(r'^logout/$', 'django.contrib.auth.views.logout', { 'next_page': '/' },
        name='logout'),

    # webhooks
    url(r'^webhooks/', include('designsafe.webhooks')),

    # cms handles everything else
    url(r'^', include('djangocms_forms.urls')),
    url(r'^', include('cms.urls')),

) + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

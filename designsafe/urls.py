"""
DesignSafe-CI URL Configuration
===============================

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/1.8/topics/http/urls/

Examples:
---------

**Function views**

#. Add an import:  from my_app import views
#. Add a URL to urlpatterns:  url(r'^$', views.home, name='home')

**Class-based views**

#. Add an import:  from other_app.views import Home
#. Add a URL to urlpatterns:  url(r'^$', Home.as_view(), name='home')
    
**Including another URLconf**

#. Add an import:  from blog import urls as blog_urls
#. Add a URL to urlpatterns:  url(r'^blog/', include(blog_urls))
"""
from django.conf import settings
from django.conf.urls import include, url
from django.conf.urls.static import static
from django.contrib import admin
from django.views.generic import RedirectView, TemplateView
from django.core.urlresolvers import reverse
from django.http import HttpResponse, HttpResponseRedirect
from designsafe.apps.auth.views import login_options as des_login_options
from django.contrib.auth.views import logout as des_logout
from designsafe.views import project_version as des_version

# sitemap - classes must be imported and added to sitemap dictionary
from django.contrib.sitemaps.views import sitemap
from cms.sitemaps import CMSSitemap
from designsafe.sitemaps import StaticViewSitemap, DynamicViewSitemap, HomeSitemap, ProjectSitemap, SubSitemap
from designsafe import views

# cms preferences
CMSSitemap.priority = 0.7
CMSSitemap.changefreq = 'weekly'

sitemaps = {
    'home': HomeSitemap,
    'subsite': SubSitemap,
    'static': StaticViewSitemap,
    'dynamic': DynamicViewSitemap,
    'projects': ProjectSitemap,
    'cmspages': CMSSitemap,
}

urlpatterns = [
    # admin
    url(r'^admin/', include(admin.site.urls)),
    url(r'^admin/impersonate/', include('impersonate.urls')),

    # sitemap
    url(r'^sitemap\.xml$', sitemap, {'sitemaps': sitemaps}, name='django.contrib.sitemaps.views.sitemap'),

    # terms-and-conditions
    url(r'^terms/', include('termsandconditions.urls')),

    url(r'^api/', include('designsafe.apps.api.urls', namespace='designsafe_api')),

    # RAMP verification
    url(r'^data/browser/public/nees.public/{}.html$'.format(settings.RAMP_VERIFICATION_ID), TemplateView.as_view(template_name='ramp_verification.html')),
    
    # api urls, just for the samples.
    url(r'^applications/', include('designsafe.apps.applications.urls',
                                namespace='designsafe_applications')),
    url(r'^data/', include('designsafe.apps.data.urls', namespace='designsafe_data')),
    url(r'^rw/workspace/', include('designsafe.apps.workspace.urls',
                                   namespace='designsafe_workspace')),
    url(r'^notifications/', include('designsafe.apps.notifications.urls',
                                    namespace='designsafe_notifications')),
    url(r'^search/', include('designsafe.apps.search.urls',
                                    namespace='designsafe_search')),
    url(r'^geo/', include('designsafe.apps.geo.urls',
                                    namespace='designsafe_geo')),
    url(r'^recon-portal/', include('designsafe.apps.rapid.urls',
                                    namespace='designsafe_rapid')),


    # auth
    url(r'^account/', include('designsafe.apps.accounts.urls',
        namespace='designsafe_accounts')),
    url(r'^register/$', RedirectView.as_view(
        pattern_name='designsafe_accounts:register', permanent=True), name='register'),

    # dashboard
    url(r'^dashboard/', include('designsafe.apps.dashboard.urls',
        namespace='designsafe_dashboard')),

    # need a fancier redirect here to pass the code param along
    url(r'^activate/(?:(?P<code>.+)/)?$',
        lambda x, code: HttpResponseRedirect(
            reverse('designsafe_accounts:email_confirmation',
                    args=[code] if code else None)
        )),
    url(r'^password-reset/(?:(?P<code>.+)/)?$',
        lambda x, code: HttpResponseRedirect(
            reverse('designsafe_accounts:password_reset',
                    args=[code] if code else None)
        )),

    # box
    url(r'^account/applications/box/', include('designsafe.apps.box_integration.urls',
        namespace='box_integration')),

    # dropbox
    url(r'^account/applications/dropbox/', include('designsafe.apps.dropbox_integration.urls',
        namespace='dropbox_integration')),

    # googledrive
    url(r'^account/applications/googledrive/', include('designsafe.apps.googledrive_integration.urls',
        namespace='googledrive_integration')),

    # google site verification
    url(r'{}.html$'.format(settings.GOOGLE_SITE_VERIFICATION_ID), TemplateView.as_view(template_name='google_verification.html')),

    # auth
    url(r'^auth/', include('designsafe.apps.auth.urls', namespace='designsafe_auth')),

    url(r'^login/$', des_login_options, name='login'),
    url(r'^logout/$', des_logout,
        {'next_page': '/auth/logged-out/'}, name='logout'),

    # help
    url(r'^help/', include('designsafe.apps.djangoRT.urls', namespace='djangoRT')),

    # webhooks
    url(r'^webhooks/', include('designsafe.webhooks')),

    # version check
    url(r'^version/', des_version),

    # cms handles everything else
    url(r'^', include('djangocms_forms.urls')),
    url(r'^', include('cms.urls')),

] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

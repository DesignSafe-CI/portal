"""DesignSafe-CI URL Configuration."""

from django.conf import settings
from django.urls import include, path
from django.conf.urls.static import static
from django.contrib import admin
from django.views.generic import RedirectView, TemplateView
from django.urls import reverse
from django.http import HttpResponseRedirect
from designsafe.apps.auth.views import login_options as des_login_options
from django.contrib.auth import logout as des_logout
from designsafe.views import project_version as des_version

# sitemap - classes must be imported and added to sitemap dictionary
from django.contrib.sitemaps.views import sitemap
from designsafe.sitemaps import StaticViewSitemap, DynamicViewSitemap, HomeSitemap, ProjectSitemap, SubSitemap, DesignSafeCMSSitemap

sitemaps = {
    'home': HomeSitemap,
    'subsite': SubSitemap,
    'static': StaticViewSitemap,
    'dynamic': DynamicViewSitemap,
    'projects': ProjectSitemap,
    'cmspages': DesignSafeCMSSitemap,
}

urlpatterns = [
    # admin
    path('admin/', include(admin.site.urls)),
    path('admin/impersonate/', include('impersonate.urls')),

    # sitemap
    path('sitemap\.xml$', sitemap, {'sitemaps': sitemaps}, name='django.contrib.sitemaps.views.sitemap'),

    # terms-and-conditions
    path('terms/', include('termsandconditions.urls')),

    # RAMP verification
    path('{}.html$'.format(settings.RAMP_VERIFICATION_ID), TemplateView.as_view(template_name='ramp_verification.html')),

    # api urls, just for the samples.
    path('applications/', include('designsafe.apps.applications.urls',
                                  namespace='designsafe_applications')),
    path('data/', include('designsafe.apps.data.urls', namespace='designsafe_data')),
    path('rw/workspace/', include('designsafe.apps.workspace.urls',
                                  namespace='designsafe_workspace')),
    path('notifications/', include('designsafe.apps.notifications.urls',
                                   namespace='designsafe_notifications')),
    path('search/', include('designsafe.apps.search.urls',
                            namespace='designsafe_search')),
    path('geo/', include('designsafe.apps.geo.urls',
                         namespace='designsafe_geo')),
    path('recon-portal/', include('designsafe.apps.rapid.urls',
                                  namespace='designsafe_rapid')),

    path('nco/api/', include('designsafe.apps.nco.api_urls', namespace='nco_api')),

    path('nco/', include('designsafe.apps.nco.urls',
                         namespace='nco')),


    path('api/', include('designsafe.apps.api.urls', namespace='designsafe_api')),


    # auth
    path('account/', include('designsafe.apps.accounts.urls',
                             namespace='designsafe_accounts')),
    path('register/$', RedirectView.as_view(
        pattern_name='designsafe_accounts:register', permanent=True), name='register'),

    # dashboard
    path('dashboard/', include('designsafe.apps.dashboard.urls',
                               namespace='designsafe_dashboard')),

    # need a fancier redirect here to pass the code param along
    path('activate/(?:(?P<code>.+)/)?$',
         lambda x, code: HttpResponseRedirect(
             reverse('designsafe_accounts:email_confirmation',
                     args=[code] if code else None)
         )),
    path('password-reset/(?:(?P<code>.+)/)?$',
         lambda x, code: HttpResponseRedirect(
             reverse('designsafe_accounts:password_reset',
                     args=[code] if code else None)
         )),

    # box
    path('account/applications/box/', include('designsafe.apps.box_integration.urls',
                                              namespace='box_integration')),

    # dropbox
    path('account/applications/dropbox/', include('designsafe.apps.dropbox_integration.urls',
                                                  namespace='dropbox_integration')),

    # googledrive
    path('account/applications/googledrive/', include('designsafe.apps.googledrive_integration.urls',
                                                      namespace='googledrive_integration')),

    # google site verification
    path(r'{}.html$'.format(settings.GOOGLE_SITE_VERIFICATION_ID), TemplateView.as_view(template_name='google_verification.html')),

    # auth
    path('auth/', include('designsafe.apps.auth.urls', namespace='designsafe_auth')),

    path('login/$', des_login_options, name='login'),
    path('logout/$', des_logout,
         {'next_page': '/auth/logged-out/'}, name='logout'),

    # help
    path('help/', include('designsafe.apps.djangoRT.urls', namespace='djangoRT')),

    # webhooks
    path('webhooks/', include('designsafe.webhooks')),

    # version check
    path('version/', des_version),

    # cms handles everything else
    path('', include('djangocms_forms.urls')),
    path('', include('cms.urls')),

]
if settings.DEBUG:
    urlpatterns + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

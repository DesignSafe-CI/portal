""" DesignSafe-CI URL Configuration.

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
from django.urls import include, re_path as url
from django.conf.urls.static import static
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from django.contrib import admin
from django.views.generic import RedirectView, TemplateView
from django.urls import reverse, path
from django.http import HttpResponseRedirect
from designsafe.apps.auth.views import tapis_oauth as login
from designsafe.apps.auth.views import LogoutView as des_logout
from designsafe.views import project_version as des_version, redirect_old_nees
from impersonate import views as impersonate_views

# sitemap - classes must be imported and added to sitemap dictionary
from django.contrib.sitemaps.views import sitemap, index
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
        path(
            "admin/impersonate/stop/",
            impersonate_views.stop_impersonate,
            name="impersonate-stop",
        ),
        path(
            "admin/impersonate/list/",
            impersonate_views.list_users,
            {"template": "impersonate/list_users.html"},
            name="impersonate-list",
        ),
        path(
            "admin/impersonate/search/",
            impersonate_views.search_users,
            {"template": "impersonate/search_users.html"},
            name="impersonate-search",
        ),
        path(
            "admin/impersonate/<int:uid>/",
            impersonate_views.impersonate,
            name="impersonate-start",
        ),
        path("admin/", admin.site.urls),

        path(
            "sitemap.xml",
            index,
            {"sitemaps": sitemaps},
            name="django.contrib.sitemaps.views.index",
        ),
        path(
            "sitemap-<section>.xml",
            sitemap,
            {"sitemaps": sitemaps},
            name="django.contrib.sitemaps.views.sitemap",
        ),

        # terms-and-conditions
        url(r'^terms/', include('termsandconditions.urls')),

        # RAMP verification
        url(r'{}.html$'.format(settings.RAMP_VERIFICATION_ID), TemplateView.as_view(template_name='ramp_verification.html')),

        # api urls, just for the samples.
        url(r'^applications/', include(('designsafe.apps.applications.urls', 'desigsnafe.apps.applications'),
            namespace='designsafe_applications')),
        # NOTE: /data is redirected to /data/browser via the CMS.
        url(r'^data/', include(('designsafe.apps.data.urls', 'designsafe.apps.data'), namespace='designsafe_data')),
        url(r'^workspace/', include(('designsafe.apps.workspace.urls', 'designsafe.apps.workspace'),
            namespace='designsafe_workspace')),
        url(r'^rw/workspace/', include(('designsafe.apps.workspace.urls', 'designsafe.apps.workspace'))),
        path('api/workspace/', include('designsafe.apps.workspace.api.urls', namespace='workspace_api')),
        url(r'^notifications/', include(('designsafe.apps.notifications.urls', 'designsafe.apps.notifications'),
            namespace='designsafe_notifications')),
        url(r'^search/', include(('designsafe.apps.search.urls', 'designsafe.apps.search'),
            namespace='designsafe_search')),
        url(r'^geo/', include(('designsafe.apps.geo.urls', 'designsafe.apps.geo'),
            namespace='designsafe_geo')),
        url(r'^recon-portal/', include(('designsafe.apps.rapid.urls', 'designsafe.apps.rapid'),
            namespace='designsafe_rapid')),

        url(r'^nco/api/', include(('designsafe.apps.nco.api_urls', 'designsafe.apps.nco'), namespace='nco_api')),

        url(r'^nco/', include(('designsafe.apps.nco.urls', 'designsafe.apps.nco'),
            namespace='nco')),


        url(r'^api/', include(('designsafe.apps.api.urls', 'designsafe.apps.api'), namespace='designsafe_api')),


        # auth
        url(r'^account/', include(('designsafe.apps.accounts.urls', 'designsafe.apps.accounts'),
            namespace='designsafe_accounts')),
        url(r'^register/$', RedirectView.as_view(
            pattern_name='designsafe_accounts:register', permanent=True), name='register'),

        # audit-trail
        url(r'^audit/', include(('designsafe.apps.audit.urls', 'designsafe.apps.audit'),
            namespace='designsafe_audit')),

        # onboarding
        url(r'^onboarding/', include(('designsafe.apps.onboarding.urls', 'designsafe.apps.onboarding'),
            namespace='designsafe_onboarding')),
        path('api/onboarding/', include('designsafe.apps.onboarding.api.urls', namespace='designsafe_onboarding_api')),


        # dashboard
    url(r'^dashboard/', include(('designsafe.apps.dashboard.urls', 'designsafe.apps.dashboard'),
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
    url(r'^account/applications/box/', include(('designsafe.apps.box_integration.urls', 'designsafe.apps.box_integration'),
        namespace='box_integration')),

    # dropbox
    url(r'^account/applications/dropbox/', include(('designsafe.apps.dropbox_integration.urls', 'designsafe.apps.dropbox_integration'),
        namespace='dropbox_integration')),

    # googledrive
    url(r'^account/applications/googledrive/', include(('designsafe.apps.googledrive_integration.urls', 'designsafe.apps.googledrive_integration'),
        namespace='googledrive_integration')),

    # google site verification
    url(r'{}.html$'.format(settings.GOOGLE_SITE_VERIFICATION_ID), TemplateView.as_view(template_name='google_verification.html')),

    # auth
    url(r'^auth/', include(('designsafe.apps.auth.urls', 'designsafe.apps.auth'), namespace='designsafe_auth')),

    url(r'^login/$', login, name='login'),
    url(r'^logout/$', des_logout.as_view(), name='logout'),

    # help
    url(r'^help/', include(('designsafe.apps.djangoRT.urls', 'designsafe.apps.djangoRT'), namespace='djangoRT')),

    # webhooks
    path('webhooks/', include('designsafe.apps.webhooks.urls', namespace='webhooks')),

    # version check
    url(r'^version/', des_version),

    # old NEES urls
    url(r'^warehouse/project/(?P<nees_prj>[0-9]+)/?', redirect_old_nees),
    url(r'^warehouse/experiment/[0-9]+/project/(?P<nees_prj>[0-9]+)/?', redirect_old_nees),
    url(r'^warehouse/hybrid/[0-9]+/project/(?P<nees_prj>[0-9]+)/?', redirect_old_nees),

    # cms handles everything else
    url(r'^', include('djangocms_forms.urls')),
    url(r'^', include('cms.urls')),
]
if settings.DEBUG:
    # https://docs.djangoproject.com/en/4.2/howto/static-files/#serving-files-uploaded-by-a-user-during-development
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

    # https://docs.djangoproject.com/en/4.2/ref/contrib/staticfiles/#static-file-development-view
    urlpatterns += staticfiles_urlpatterns()

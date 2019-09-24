"""DesignSafe-CI URL Configuration."""

from django.conf import settings
from django.conf.urls import url, include
from django.conf.urls.static import static
from django.contrib import admin
from django.contrib.sitemaps.views import sitemap
from django.contrib.sites.models import Site
from cms.sitemaps import CMSSitemap  # pylint:disable=import-error


class DesignsafeCMSSitemap(CMSSitemap):  # pylint:disable=too-few-public-methods
    """Designsafe CMS site map class."""

    priority = .7
    changefreq = 'weekly'

    def get_urls(self, site=None, **kwargs):
        """Get urls override."""
        site = Site(domain='www.designsafe-ci.org')
        return super(DesignsafeCMSSitemap, self).get_urls(site=site, **kwargs)


urlpatterns = [
    # cms sitemap
    url(r'^cms_sitemap\.xml$',
        sitemap,
        {'sitemaps': {'cmspages': DesignsafeCMSSitemap}}),
    url(r'^cms-admin/', admin.site.urls),
    url('', include('djangocms_forms.urls')),
    url('', include('cms.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

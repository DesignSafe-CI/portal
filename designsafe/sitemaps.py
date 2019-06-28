"""
DesignSafe-CI Sitemap Configuration
===================================

The django sitemap framework works with 'designsafe.urls'.
For more information on django sitemap:
    https://docs.djangoproject.com/en/2.0/ref/contrib/sitemaps/

**Adding dynamic urls**

Urls in ``designsafe.urls`` with a ``namespace`` variable need to be imported. 
Once the ``urls.py`` is added from apps assign it to the ``dynamic_apps`` 
dictionary like so:

 * ``'namespace_name': imported_urls,``
 * ``'designsafe_api': api_urls.urlpatterns,``

**Creating New Sitemaps**

New sitemaps must be added to ``designsafe.urls`` sitemap dictionary

**Public Projects**

Adding Public Projects requires the use of ``PublicElasticFileManager`` to 
access items within ``nees.public`` on Agave.

**Priority and Changefreq preferences**

Adjusting these settings for the CMS is handled in ``designsafe.urls``

 *  Changefreq - determines how often the page will be crawled
 *  Priority - lets crawlers know which DesignSafe-CI pages are most important
"""

from django.contrib import sitemaps
from django.contrib.sites.models import Site
from django.urls import reverse
from designsafe.apps.api.agave.filemanager.public_search_index import PublicElasticFileManager as pefm
from designsafe.apps.api.agave import get_service_account_client

# imported urlpatterns from apps
import urls     # from designsafe import urls not working?
from designsafe.apps.accounts import urls as accounts_urls
from designsafe.apps.api import urls as api_urls
from designsafe.apps.data import urls as data_urls
from designsafe.apps.workspace import urls as workspace_urls
from designsafe.apps.notifications import urls as notifications_urls
from designsafe.apps.search import urls as search_urls
from designsafe.apps.djangoRT import urls as help_urls
from designsafe.apps.geo import urls as geo_urls
from designsafe.apps.applications import urls as applications_urls
from designsafe.apps.dashboard import urls as dashboard_urls
from designsafe.apps.box_integration import urls as box_integration_urls
from designsafe.apps.dropbox_integration import urls as dropbox_integration_urls
from designsafe.apps.googledrive_integration import urls as googledrive_integration_urls
from cms.sitemaps import CMSSitemap

# Home
class HomeSitemap(sitemaps.Sitemap):
    priority = 1.0
    changefreq = 'weekly'

    def get_urls(self, site=None, **kwargs):
        site = Site(domain='www.designsafe-ci.org')
        return super(HomeSitemap, self).get_urls(site=site, **kwargs)
    
    def items(self):
        return ['']

    def location(self, item):
        return item

# Subsites
class SubSitemap(sitemaps.Sitemap):
    priority = 0.8
    changefreq = 'weekly'

    # redefine 'get_urls' so we can set 'domain' and 'name' to empty
    # then feed in the subsite urls
    def get_urls(self, site=None, **kwargs):
        site = Site(domain='' , name= '')
        return super(SubSitemap, self).get_urls(site=site, **kwargs)

    def items(self):
        sublist = []
        for subsite in Site.objects.all():
            sublist.append(subsite)
        return sublist[1:]

    def location(self, item):
        return item

# Static - for base urls with 'name'
class StaticViewSitemap(sitemaps.Sitemap):
    priority = 0.7
    changefreq = 'weekly'

    def get_urls(self, site=None, **kwargs):
        site = Site(domain='www.designsafe-ci.org')
        return super(StaticViewSitemap, self).get_urls(site=site, **kwargs)

    def items(self):

        names_list = []
        for pattern in urls.urlpatterns:
            if hasattr(pattern, 'name') and pattern.name is not None:
                try:
                    reverse(str(pattern.name))
                    names_list.append(str(pattern.name))
                except:
                    pass
        return names_list

    def location(self, item):
        return reverse(item)

# Dynamic - every new url w/ 'namespace' needs to be added to this dictionary
# rapid not included due to admin links
dynamic_apps = {
    'designsafe_api': api_urls.urlpatterns,
    'designsafe_applications': applications_urls.urlpatterns,
    'designsafe_data': data_urls.urlpatterns,
    'designsafe_workspace': workspace_urls.urlpatterns,
    'designsafe_notifications': notifications_urls.urlpatterns,
    'designsafe_search': search_urls.urlpatterns,
    'djangoRT': help_urls.urlpatterns,
    'designsafe_geo': geo_urls.urlpatterns,
    'designsafe_accounts': accounts_urls.urlpatterns,
    'designsafe_dashboard': dashboard_urls.urlpatterns,
    'box_integration': box_integration_urls.urlpatterns,
    'dropbox_integration': dropbox_integration_urls.urlpatterns,
    'googledrive_integration': googledrive_integration_urls.urlpatterns,
}

class DynamicViewSitemap(sitemaps.Sitemap):
    priority = 0.8
    changefreq = 'weekly'

    def get_urls(self, site=None, **kwargs):
        site = Site(domain='www.designsafe-ci.org')
        return super(DynamicViewSitemap, self).get_urls(site=site, **kwargs)

    def items(self):

        names_list = []
 
        for app in dynamic_apps:
            for item in dynamic_apps[app]:
                if hasattr(item, 'name') and item.name is not None:
                    try:
                        reverse(str(app) + ":" + str(item.name))
                        names_list.append(str(app) + ":" + str(item.name))
                    except:
                        pass

        return names_list

    def location(self, item):
        return reverse(item)

# public projects - pulling in urls from agave
class ProjectSitemap(sitemaps.Sitemap):
    priority = 0.6
    changefreq = 'weekly'

    def get_urls(self, site=None, **kwargs):
        site = Site(domain='www.designsafe-ci.org')
        return super(ProjectSitemap, self).get_urls(site=site, **kwargs)

    def items(self):
        client = get_service_account_client()
        projPath = []

        # pefm - PublicElasticFileManager to grab public projects
        count = 0
        while True:
            count += 200
            projects = pefm(client).listing('nees.public', '/', 0, count).to_dict()
            if len(projects['children']) < count:
                break

        for proj in projects['children']:
            if 'project' in proj:
                # projects
                subpath = {
                    'root' : reverse('designsafe_data:data_depot'),
                    'project' : proj['project'],
                    'system' : proj['system']
                }
                projPath.append('{root}public/{system}/{project}'.format(**subpath))
            else:
                # nees projects
                subpath = {
                    'root' : reverse('designsafe_data:data_depot'),
                    'project' : proj['path'],
                    'system' : proj['systemId']
                }
                projPath.append('{root}public/{system}/{project}'.format(**subpath))

        return projPath

    def location(self, item):
        return item


class CMSSitemap_modified(CMSSitemap):
    priority = .7
    changefreq = 'weekly'

    def get_urls(self, site=None, **kwargs):
        site = Site(domain='www.designsafe-ci.org')
        return super(CMSSitemap, self).get_urls(site=site, **kwargs)



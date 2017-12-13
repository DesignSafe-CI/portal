from django.contrib import sitemaps
from django.urls import reverse
import urls

# imported urlpatterns from apps
# urls with 'namespace' must have their urls imported and added to dynamic_apps dict
from designsafe.apps.accounts import urls as accounts_urls
from designsafe.apps.api import urls as api_urls
from designsafe.apps.data import urls as data_urls
from designsafe.apps.workspace import urls as workspace_urls
from designsafe.apps.notifications import urls as notifications_urls
from designsafe.apps.search import urls as search_urls
from designsafe.apps.geo import urls as geo_urls
from designsafe.apps.auth import urls as auth_urls
from designsafe.apps.rapid import urls as rapid_urls
from designsafe.apps.applications import urls as applications_urls
from designsafe.apps.dashboard import urls as dashboard_urls
from designsafe.apps.box_integration import urls as box_integration_urls
from designsafe.apps.dropbox_integration import urls as dropbox_integration_urls
from designsafe.apps.googledrive_integration import urls as googledrive_integration_urls


# Home
class HomeSitemap(sitemaps.Sitemap):
    priority = 1.0
    changefreq = 'weekly'

    def items(self):
        return ['']

    def location(self, item):
        return item

# Static
class StaticViewSitemap(sitemaps.Sitemap):
    priority = 0.7
    changefreq = 'weekly'

    def items(self):

        # Static
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


# Dynamic - every new app needs to be added for the sitemap
dynamic_apps = {
    'designsafe_api': api_urls.urlpatterns,
    'designsafe_applications': applications_urls.urlpatterns,
    'designsafe_data': data_urls.urlpatterns,
    'designsafe_workspace': workspace_urls.urlpatterns,
    'designsafe_notifications': notifications_urls.urlpatterns,
    'designsafe_search': search_urls.urlpatterns,
    'designsafe_geo': geo_urls.urlpatterns,
    #'designsafe_rapid': rapid_urls.urlpatterns,    # contains admin links
    'designsafe_accounts': accounts_urls.urlpatterns,
    'designsafe_dashboard': dashboard_urls.urlpatterns,
    'box_integration': box_integration_urls.urlpatterns,
    'dropbox_integration': dropbox_integration_urls.urlpatterns,
    'googledrive_integration': googledrive_integration_urls.urlpatterns,
}

class DynamicViewSitemap(sitemaps.Sitemap):
    priority = 0.8
    changefreq = 'weekly'

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
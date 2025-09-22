"""CMS plugins for Tools & Applications pages."""

import logging
from cms.plugin_base import CMSPluginBase
from cms.plugin_pool import plugin_pool
from designsafe.apps.workspace.models.app_entries import (
    AppListingEntry,
)
from designsafe.apps.workspace.models.app_cms_plugins import (
    AppCategoryListingPlugin,
    RelatedAppsPlugin,
    AppVariantsPlugin,
)

logger = logging.getLogger(__name__)


def get_instance_from_url(url):
    """Helper function to get an AppListingEntry instance based on URL."""

    app_listing_entries = AppListingEntry.objects.filter(enabled=True)
    for entry in app_listing_entries:
        if entry.href == url:
            return entry

        return None


class AppCategoryListing(CMSPluginBase):
    """CMS plugin to render the list of apps for a given category."""

    model = AppCategoryListingPlugin
    name = "App Category Listing"
    module = "Tools & Applications"
    render_template = "designsafe/apps/workspace/app_listing_plugin.html"
    cache = False

    def render(self, context, instance, placeholder):
        context = super().render(context, instance, placeholder)
        listing_entries = AppListingEntry.objects.filter(
            category=instance.app_category, enabled=True
        )
        serialized_listing = [
            {
                "label": entry.label,
                "icon": entry.icon,
                "description": entry.description,
                "tags": [tag.name for tag in entry.tags.all()],
                "is_popular": entry.is_popular,
                "is_simcenter": entry.is_simcenter,
                "license_type": (
                    "Open Source" if entry.license_type == "OS" else "Licensed"
                ),
                "href": entry.href,
            }
            for entry in listing_entries
        ]
        context["listing"] = serialized_listing
        return context


plugin_pool.register_plugin(AppCategoryListing)


class RelatedApps(CMSPluginBase):
    """CMS plugin to render related apps."""
    # IDEA: Use get_instance_from_url, not RelatedAppsPlugin plugin

    model = RelatedAppsPlugin
    name = "Related Apps"
    module = "Tools & Applications"
    render_template = "designsafe/apps/workspace/related_apps_plugin.html"
    cache = False

    def render(self, context, instance: AppListingEntry, placeholder):
        context = super().render(context, instance, placeholder)
        listing_entries = instance.app.related_apps.filter(enabled=True).order_by(
            "label"
        )
        serialized_listing = [
            {
                "label": entry.label,
                "icon": entry.icon,
                "description": entry.description,
                "tags": [tag.name for tag in entry.tags.all()],
                "is_popular": entry.is_popular,
                "is_simcenter": entry.is_simcenter,
                "license_type": (
                    "Open Source" if entry.license_type == "OS" else "Licensed"
                ),
                "href": entry.href,
            }
            for entry in listing_entries
        ]
        context["listing"] = serialized_listing
        return context


plugin_pool.register_plugin(RelatedApps)


class AppVariants(CMSPluginBase):
    """CMS plugin to render an apps versions/variants."""
    # IDEA: Use get_instance_from_url, not AppVariantsPlugin plugin

    model = AppVariantsPlugin
    name = "App Version Selection"
    module = "Tools & Applications"
    render_template = "designsafe/apps/workspace/app_variant_plugin.html"
    cache = False

    def render(self, context, instance: AppListingEntry, placeholder):
        context = super().render(context, instance, placeholder)
        app_variants = instance.app.appvariant_set.order_by("priority")
        context["listing"] = app_variants

        return context


plugin_pool.register_plugin(AppVariants)


class UserGuideLink(CMSPluginBase):
    """CMS plugin to render the user guide link."""


    name = "User Guide Link"
    module = "Tools & Applications"
    render_template = "designsafe/apps/workspace/app_user_guide_link_plugin.html"
    cache = False

    def render(self, context, instance=None, placeholder=None):
        if instance is None:
            instance = get_instance_from_url(context.request.path)
        if instance is None:
            raise ValueError("No matching AppListingEntry found")
        context = super().render(context, instance, placeholder)
        context["user_guide_link"] = instance.user_guide_link
        return context


plugin_pool.register_plugin(UserGuideLink)

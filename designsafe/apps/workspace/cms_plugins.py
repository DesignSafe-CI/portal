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

    model = AppVariantsPlugin
    name = "App Version Selection"
    module = "Tools & Applications"
    render_template = "designsafe/apps/workspace/app_variant_plugin.html"
    cache = False

    def render(self, context, instance: AppListingEntry, placeholder):
        context = super().render(context, instance, placeholder)
        app_variants = instance.app.appvariant_set.filter(enabled=True)
        context["listing"] = app_variants
        context["app"] = {
            "label": instance.app.label
        }

        return context


plugin_pool.register_plugin(AppVariants)

"""CMS plugins for Tools & Applications pages."""

import logging
from typing import Optional, Union
from cms.plugin_base import CMSPluginBase
from cms.plugin_pool import plugin_pool
from designsafe.apps.workspace.models.app_entries import (
    AppListingEntry,
)
from designsafe.apps.workspace.models.app_cms_plugins import (
    AppCategoryListingPlugin,
    RelatedAppsPlugin,
    AppVariantsPlugin,
    AppUserGuideLinkPlugin,
)

logger = logging.getLogger(__name__)


def get_entry_instance(url):
    """Helper function to get an AppListingEntry instance based on URL."""

    app_listing_entries = AppListingEntry.objects.filter(enabled=True)
    for entry in app_listing_entries:
        if entry.href in url:
            return entry

    return None

def is_editing_text(url):
    """Helper function to determine if the current context is editing text."""

    return 'admin/cms/page/edit-plugin' in url


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
    # IDEA: Use get_entry_instance if model field is empty (i.e. auto value)

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
    # IDEA: Use get_entry_instance if model field is empty (i.e. auto value)

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


class AppUserGuideLink(CMSPluginBase):
    """CMS plugin to render the user guide link."""

    model = AppUserGuideLinkPlugin
    name = "App User Guide Link"
    module = "Tools & Applications"
    render_template = "designsafe/apps/workspace/app_user_guide_link_plugin.html"
    text_enabled = True
    cache = False


    def render(
        self,
        context,
        instance: Optional[Union[AppUserGuideLinkPlugin, AppListingEntry]] = None,
        placeholder=None,
    ):
        plugin_instance = instance if isinstance(instance, AppUserGuideLinkPlugin) else None

        instance_app = None
        if isinstance(instance, AppUserGuideLinkPlugin):
            instance_app = getattr(instance, "app", None)
        if instance_app is None:
            instance_app = get_entry_instance(context.get("request").path)

        context = super().render(context, plugin_instance, placeholder)
        context["user_guide_link"] = getattr(instance_app, "user_guide_link", None)
        context["is_editing_text"] = is_editing_text(context.get("request").path)
        return context


plugin_pool.register_plugin(AppUserGuideLink)

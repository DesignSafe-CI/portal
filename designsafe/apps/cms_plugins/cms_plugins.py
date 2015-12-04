try:
    import urlparse
except ImportError:
    from urllib import parse as urlparse

from cms.plugin_base import CMSPluginBase
from cms.plugin_pool import plugin_pool
from designsafe.apps.cms_plugins.models import ResponsiveEmbedPlugin
from django.conf import settings
from django.utils.translation import ugettext as _


class CMSResponsiveEmbedPlugin(CMSPluginBase):
    model = ResponsiveEmbedPlugin  # model where plugin data are saved
    module = _("Bootstrap")
    name = _("Responsive Embed")  # name of the plugin in the interface
    text_enabled = True
    render_template = "cms_plugins/responsive_embed_plugin.html"

    def render(self, context, instance, placeholder):
        context.update({'instance': instance})
        return context

    def icon_src(self, instance):
        return urlparse.urljoin(
            settings.STATIC_URL, "cms/img/icons/plugins/image.png")

plugin_pool.register_plugin(CMSResponsiveEmbedPlugin)  # register the plugin

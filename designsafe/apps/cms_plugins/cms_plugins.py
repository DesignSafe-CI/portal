from cms.plugin_base import CMSPluginBase
from cms.plugin_pool import plugin_pool
from designsafe.apps.cms_plugins.models import ResponsiveEmbedPlugin
from django.utils.translation import ugettext as _


class CMSResponsiveEmbedPlugin(CMSPluginBase):
    model = ResponsiveEmbedPlugin  # model where plugin data are saved
    module = _("Responsive Embed")
    name = _("Responsive Embed Plugin")  # name of the plugin in the interface
    render_template = "cms_plugins/responsive_embed_plugin.html"

    def render(self, context, instance, placeholder):
        context.update({'instance': instance})
        return context

plugin_pool.register_plugin(CMSResponsiveEmbedPlugin)  # register the plugin

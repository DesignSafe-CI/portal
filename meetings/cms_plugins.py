from cms.plugin_pool import plugin_pool
from cms.plugin_base import CMSPluginBase
from cmsplugin_cascade.plugin_base import CascadePluginBase
from .forms import MeetingRequestForm

@plugin_pool.register_plugin
class MeetingFormPlugin(CMSPluginBase):
    name = 'Meeting Request Form'
    render_template = "meetings/cms/plugin.html"

    def render(self, context, instance, placeholder):
        context['instance'] = instance
        context['form'] = MeetingRequestForm()

        return context

@plugin_pool.register_plugin
class MeetingFormCascadePlugin(CascadePluginBase):
    name = 'Meeting Request Form (Cascade)'
    render_template = "meetings/cms/plugin.html"

    def render(self, context, instance, placeholder):
        context['instance'] = instance
        context['form'] = MeetingRequestForm()

        return context
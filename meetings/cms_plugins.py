from cms.plugin_base import CMSPluginBase
from cms.plugin_pool import plugin_pool
from .forms import MeetingRequestForm

@plugin_pool.register_plugin
class MeetingFormPlugin(CMSPluginBase):
    name = 'Meeting Request Form'
    render_template = "meetings/cms/plugin.html"

    def render(self, context, instance, placeholder):
        context['instance'] = instance
        context['form'] = MeetingRequestForm()

        return context
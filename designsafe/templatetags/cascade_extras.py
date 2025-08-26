from django import template
from django.template.loader import get_template
from django.utils.safestring import mark_safe

register = template.Library()


@register.simple_tag(takes_context=True)
def cascade_include_original(context, template_name, instance=None):
    """Render the original cascade template and return it.

    Use this to avoid copying the plugin markup into an override. Pass the
    plugin template path relative to cascade templates, e.g.
    'cascade/bootstrap3/accordion.html'.
    """
    tpl = get_template(template_name)
    # create a shallow copy of the context so we don't mutate it
    local_context = dict(context.flatten())
    if instance is not None:
        local_context['instance'] = instance
    return mark_safe(tpl.render(local_context))

from django.conf import settings
from django.contrib.messages.api import get_messages
from django.contrib.messages.constants import DEFAULT_LEVELS


def analytics(request):
    """
    Use the variables returned in this function to
    render your Google Analytics tracking code template.
    """
    context = {}
    ga_prop_id = getattr(settings, 'GOOGLE_ANALYTICS_PROPERTY_ID', False)
    if not settings.DEBUG and ga_prop_id:
        context['GOOGLE_ANALYTICS_PROPERTY_ID'] = ga_prop_id
    return context


def messages(request):
    """
    Same as the default messages middleware, but it is duplicate-message aware,
    preventing duplicate messages with the same content from being displayed.

    Args:
        request:

    Returns:
        a dict of messages to be added to the context
    """
    msgs = []
    unique_msgs = []
    context = {}

    user_agent = request.META['HTTP_USER_AGENT']
    ga_supported_user_agents = getattr(settings, 'SUPPORTED_USER_AGENTS', False)
    agent_is_supported = any(agent in user_agent for agent in ga_supported_user_agents)

    for m in get_messages(request):
        if m.message not in msgs:
            msgs.append(m.message)
            unique_msgs.append(m)
    context = {
        'messages': unique_msgs,
        'DEFAULT_MESSAGE_LEVELS': DEFAULT_LEVELS,
        'AGENT_IS_SUPPORTED': agent_is_supported
    }
    return context

def debug(request):
    context = {}
    if settings.DEBUG:
        context = {
            'debug': True
        }
    return context

def site_verification(request):
    context = {}
    google_verification_id = getattr(settings, 'GOOGLE_SITE_VERIFICATION_ID', False)
    if google_verification_id:
        context['GOOGLE_SITE_VERIFICATION_ID'] = google_verification_id
    return context

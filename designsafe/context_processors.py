from django.conf import settings

def analytics( request ):
    """
    Use the variables returned in this function to
    render your Google Analytics tracking code template.
    """
    context = {}
    ga_prop_id = getattr( settings, 'GOOGLE_ANALYTICS_PROPERTY_ID', False )
    if not settings.DEBUG and ga_prop_id:
        context['GOOGLE_ANALYTICS_PROPERTY_ID'] = ga_prop_id
    return context

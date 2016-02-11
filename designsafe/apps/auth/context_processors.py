from django.conf import settings


def auth(request):
    session_key = getattr(settings, 'AGAVE_TOKEN_SESSION_ID')
    context = {
        'agave_ready': session_key in request.session
    }
    return context

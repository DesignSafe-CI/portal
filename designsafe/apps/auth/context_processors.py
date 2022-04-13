from designsafe.apps.auth.models import AgaveOAuthToken


def auth(request):
    try:
        ag_token = request.user.tapis_oauth
        context = {
            'agave_ready': ag_token is not None
        }
    except (AttributeError, AgaveOAuthToken.DoesNotExist):
        context = {
            'agave_ready': False
        }
    return context

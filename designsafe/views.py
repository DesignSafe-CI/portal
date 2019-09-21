import logging
from django.http import HttpResponse

logger = logging.getLogger(__name__)


def project_version(request):
    try:
        with open('.git/HEAD') as f:
            head = f.readline()

        if 'ref:' in head:
            # we're on a branch
            branch = head.split(':')[1].strip()
            with open('.git/{0}'.format(branch)) as f:
                version = '{}:{}'.format(branch, f.readline())
        else:
            # we're in a detached head, e.g., a tag. would be nice to show tag name...
            version = head

    except IOError:
        logger.warn('Unable to read project version from git HEAD')
        version = 'UNKNOWN'

    return HttpResponse(version, content_type='text/plain')

def redirect_to_cms(request):
    """Redirect request to cms using X-ACCEL-REDIRECT."""
    response = HttpResponse()
    response["X-Accel-Redirect"] = "/internal_cms/{}".format(
        request.path,
    )

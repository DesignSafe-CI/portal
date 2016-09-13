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
                rev = f.readline()
        else:
            # we're in a detached head
            rev = head

    except IOError:
        logger.warn('Unable to read project version from git HEAD')
        rev = 'UNKNOWN'

    return HttpResponse(rev, content_type='text/plain')

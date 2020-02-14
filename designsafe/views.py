import logging
from django.http import HttpResponse
from django.shortcuts import redirect

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

def redirect_old_nees(request, nees_prj):
    """
    Parse old NEES.org url and pull out part of the NEES ID (Project Number)
    Returns: call to redirect method to a search page
    """
    nees_prj = str(nees_prj)
    if len(nees_prj) is not 4:
        nees_prj = '0'*(4 - len(nees_prj)) + nees_prj
    url = '/search/?query_string=NEES {}'.format(nees_prj)
    return redirect(url)

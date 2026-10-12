import logging

from django.contrib.auth.decorators import login_required
from django.shortcuts import render

logger = logging.getLogger(__name__)
metrics_logger = logging.getLogger('metrics')

@login_required
def index(request):
    metrics_logger.info('HazMapper Index',
                 extra = {
                     'user': request.user.username,
                     'sessionId': getattr(request.session, 'session_key', ''),
                     'operation': 'hazmapper_index_view'
                 })
    return render(request, 'designsafe/apps/geo/index.html')

@login_required
def test(request):
    return render(request, 'designsafe/apps/geo/test.html')

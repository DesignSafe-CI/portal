from django.shortcuts import render
from django.contrib.auth.decorators import login_required


@login_required
def audit_trail(request):
    """
    Audit trail view - renders React component for audit functionality
    """
    context = {'title': 'Audit Trail'}
    return render(request, 'designsafe/apps/audit/audit_trail.html', context) 
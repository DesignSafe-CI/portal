from django.shortcuts import render
from django.http import JsonResponse
from django.db import connections
from django.contrib.auth.decorators import login_required

@login_required
def audit_trail(request):
    """
    Audit trail view - renders React component for audit functionality
    """
    context = {'title': 'Audit Trail'}
    return render(request, 'designsafe/apps/audit/audit_trail.html', context) 

def get_audit_user_last_session(request, username):
    source = request.GET.get('source', 'portal')
    table = 'public.portal_audit' if source == 'portal' else 'public.tapis_files_audit'
    try:
        audit_db = connections['audit']
        cursor = audit_db.cursor()

        query = f"""
        SELECT session_id, timestamp, portal, username, action, data
        FROM {table}
        WHERE session_id = (
            SELECT session_id
            FROM public.portal_audit
            WHERE username = %s
            ORDER BY timestamp DESC
            LIMIT 1
        )
        ORDER BY timestamp ASC;
        """

        cursor.execute(query, [username])
        columns = [col[0] for col in cursor.description]
        results = [dict(zip(columns, row)) for row in cursor.fetchall()]
        cursor.close()

        return JsonResponse({'data': results})
    
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


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

def get_portal_audit_search(request, username):
    """
    Fetches audit records for given username from portal audit database
    """
    try:
        audit_db = connections['audit']
        cursor = audit_db.cursor()

        #for "joyce_cywu" search(many results) -- TEST -- won't work for other usernames
        query = f"""
        SELECT session_id, timestamp, portal, username, action, tracking_id, data
        FROM public.portal_audit
        WHERE session_id = 'np0qhb1qf1p0vyphzpv1u6aosafszidk'
        AND username = %s
        ORDER BY timestamp ASC;
        """

        #for REAL most recent session -- real use
        # query = f"""
        # SELECT session_id, timestamp, portal, username, action, tracking_id, data
        # FROM {table}
        # WHERE session_id = (
        #     SELECT session_id
        #     FROM public.portal_audit
        #     WHERE username = %s
        #     ORDER BY timestamp DESC
        #     LIMIT 1
        # )
        # ORDER BY timestamp ASC;
        
        # """
        
        cursor.execute(query, [username])
        columns = [col[0] for col in cursor.description]
        results = [dict(zip(columns, row)) for row in cursor.fetchall()]
        cursor.close()
        print("Query successful.")
        return JsonResponse({'data': results})
    
    except Exception as e:
        print("Error in get_audit_search:", str(e))

        return JsonResponse({'error': str(e)}, status=500)
    

# Used as test for now
def get_tapis_files_audit_search(request, filename):
    """
    Fetches audit records given filename from tapis files audit database
    """
    # Test output to verify the function is being called correctly
    test_data = {
        'data': [
            {
                'session_id': 'test_session_123',
                'timestamp': '2024-01-15T10:30:00Z',
                'portal': 'tapis',
                'filename': filename,  
                'action': 'file_upload',
                'tracking_id': 'track_456',
                'data': {
                    'search_term': 'test_file.txt',
                    'results_count': 5,
                    'search_path': '/home/user/documents'
                }
            },
            {
                'session_id': 'test_session_123',
                'timestamp': '2024-01-15T10:35:00Z',
                'portal': 'tapis',
                'filename': filename,
                'action': 'file_download',
                'tracking_id': 'track_457',
                'data': {
                    'file_path': '/home/user/documents/test_file',
                    'file_size': '1024',
                    'download_success': True
                }
            }
        ]
    }
    return JsonResponse(test_data)


def get_usernames_portal(request):
    """
    Updating array with usernames for search
    """
    try:
        audit_db = connections['audit']
        cursor = audit_db.cursor()

        query = """
        SELECT DISTINCT username 
        FROM public.portal_audit
        ORDER BY username;
        """

        cursor.execute(query)
        usernames = [row[0] for row in cursor.fetchall()]
        
        return JsonResponse({'usernames': usernames})
    
    except Exception as e:
        print("Error in update_usernames_autocomplete:", str(e))
        return JsonResponse({'error': str(e)}, status=500)





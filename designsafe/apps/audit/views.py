"""Views for the audit app."""
from django.shortcuts import render
from django.http import JsonResponse
from django.db import connections, Error as DatabaseError
from django.contrib.auth.decorators import login_required


@login_required
def audit_trail(request):
    """
    Audit trail view - renders React component for audit functionality
    """
    context = {"title": "Audit Trail"}
    return render(request, "designsafe/apps/audit/audit_trail.html", context)


def get_portal_audit_search(request, username):
    """
    Fetches audit records for given username from portal audit database
    """
    try:
        audit_db = connections["audit"]
        cursor = audit_db.cursor()

        # TEST - "joyce_cywu"
        # query = """
        #     SELECT session_id, timestamp, portal, username, action, tracking_id, data
        #     FROM public.portal_audit
        #     WHERE session_id = 'np0qhb1qf1p0vyphzpv1u6aosafszidk'
        #     AND username = %s
        #     ORDER BY timestamp ASC;
        #     """

        query = """
        SELECT session_id, timestamp, portal, username, action, tracking_id, data
        FROM public.portal_audit
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
        print("Query successful.")
        return JsonResponse({"data": results})
    except DatabaseError as exc:
        print("Error in get_audit_search:", str(exc))
        return JsonResponse({"error": str(exc)}, status=500)


def get_tapis_files_audit_search(request, filename):
    """
    Fetches audit records given filename from tapis files audit database
    """
    # TODO: Implement database query for file tracking
    return JsonResponse({"data": []})


def get_usernames_portal(request):
    """
    Updating array with usernames for search
    """
    try:
        audit_db = connections["audit"]
        cursor = audit_db.cursor()

        query = """
            SELECT DISTINCT username
            FROM public.portal_audit
            ORDER BY username;
            """

        cursor.execute(query)
        usernames = [row[0] for row in cursor.fetchall()]

        return JsonResponse({"usernames": usernames})
    except DatabaseError as exc:
        print("Error in update_usernames_autocomplete:", str(exc))
        return JsonResponse({"error": str(exc)}, status=500)

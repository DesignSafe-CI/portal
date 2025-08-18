"""Views for the audit app."""

from django.shortcuts import render
from django.http import JsonResponse
from django.db import connections, Error as DatabaseError
from django.contrib.auth.decorators import login_required
import json


# portals.c7b61598a1d9d658ddfa68d6fb03a065d8d21c303cb32fb22df24b250f7c4a79 -- tracking_id - jake book upload
@login_required
def audit_trail(request):
    """
    Audit trail view - renders React component for audit functionality
    """
    context = {"title": "Audit Trail"}
    return render(request, "designsafe/apps/audit/audit_trail.html", context)


def trace_file_portal_search(rows, filename):
    def return_as_dict(v):
        if isinstance(v, dict):
            return v
        if isinstance(v, str):
            try:
                return json.loads(v)
            except Exception:
                return {}
    #normalize input: accept {"data": [...]} or the list itself
    if isinstance(rows, dict) and "data" in rows:
        rows = rows.get("data") or []
    if not isinstance(rows, list):
        return []

    seed = (filename or "").strip().lower()
    aliases = {seed} if seed else set()
    kept = []

    def get_basename_from_path(p):
        return (p or "").rstrip("/").split("/")[-1].lower()

    for r in rows:
        action = (r.get("action") or "").lower()
        data = return_as_dict(r.get("data"))

        #skip if it can't be parsed
        if not isinstance(data, dict):
            continue

        body = data.get("body", {}) if isinstance(data, dict) else {}

        if action == "upload":
            fname = (body.get("file_name") or "").strip().lower()
            if fname and fname in aliases:
                kept.append(r)

        elif action == "rename":
            base = get_basename_from_path(data.get("path"))
            if base and base in aliases:
                new_name = (body.get("new_name") or "").strip().lower()
                if new_name:
                    aliases.add(new_name)
                kept.append(r)

        elif action == "move":
            base = get_basename_from_path(data.get("path"))
            if base and base in aliases:
                kept.append(r)

        elif action == "trash":
            base = get_basename_from_path(data.get("path"))
            if not base:
                base = get_basename_from_path(body.get("path"))
            if base and base in aliases:
                kept.append(r)

        elif action == "submitjob":
            job = body.get("job", {}) if isinstance(body, dict) else {}
            file_inputs = job.get("fileInputs") or []

            for fi in file_inputs:
                if isinstance(fi, dict):
                    source_url = fi.get("sourceUrl")
                    if source_url:
                        base = get_basename_from_path(source_url)
                        if base and base in aliases:
                            kept.append(r)
                            break
    return kept

def trace_file_tapis_search(rows, filename):
    # TODO: once DB is back up and running need to implement search for tapis file
    # getting rows via action upload, ACTION_UPLOAD, ACTION_MOVE, ACTION_DELETE
    # set aliases to filename
    # rows upload & ACTION_UPLOAD -> check base of target_path -> if matching in aliases, add to kept
    # rows ACTION_MOVE -> either a rename or move ->
    #       check for rename
    #          if base in source_path in aliases
    pass

def get_portal_session_audit_search(request, username):
    """
    Fetches audit records for given username from portal audit database
    """
    try:
        audit_db = connections["audit"]
        cursor = audit_db.cursor()

        # region TEST - "joyce_cywu"
        # query = """
        # SELECT session_id, timestamp, portal, username, action, tracking_id, data
        # FROM public.portal_audit
        # WHERE session_id = 'np0qhb1qf1p0vyphzpv1u6aosafszidk'
        # AND username = %s
        # ORDER BY timestamp ASC;
        #     """
        # endregion

        query = """
        SELECT timestamp, portal, username, action, tracking_id, data
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
        results = [dict(zip(columns, row)) for row in cursor.fetchall()] #getting to json
        cursor.close()
        print("Portal recent session query successful.", flush=True)
        return JsonResponse({"data": results})
    except DatabaseError as exc:
        print("Error in get_portal_audit_search:", str(exc))
        return JsonResponse({"error": str(exc)}, status=500)


def get_portal_file_audit_search(request, filename):
    """
    Fetches audit records given filename from portal audit database
    """
    try:
        audit_db = connections["audit"]
        cursor = audit_db.cursor()

        # region - test queries
        # query = """
        # SELECT timestamp, portal, username, action, tracking_id, data
        # FROM public.portal_audit
        # WHERE tracking_id = (
        #     SELECT tracking_id
        #     FROM public.portal_audit
        #     WHERE action = 'upload'
        #     AND data::text ILIKE %s
        #     LIMIT 1
        # )
        # AND tracking_id IS NOT NULL
        # AND action IN ('upload', 'rename', 'move', 'trash', 'download')
        # ORDER BY "timestamp" ASC;
        # """

        # test query which basically gets the all the tracking_ids from all rows that
        #have the filename in its data field. From there goes through every single tracking_id, looks at all its rows,
        #and selects the ones that have either upload, rename, move, trash, download, or submitJob as its actions.
        #From there it creates a giant JSON file with every possible row that i need to check against
        #created because tracking_id is not as viable as originally thought, same file uploads were spread across multiple tracking_ids

        #-- e.g. "%MPAKCE.tcl%"
        # query = """
        # WITH hits AS (
        # SELECT DISTINCT tracking_id
        # FROM public.portal_audit
        # WHERE data::text ILIKE %s
        # ),
        # events AS (
        # SELECT pa.session_id, pa.timestamp, pa.portal, pa.username,
        #         pa.action, pa.tracking_id, pa.data
        # FROM public.portal_audit pa
        # JOIN hits h ON h.tracking_id = pa.tracking_id
        # WHERE lower(pa.action) IN ('upload','rename','move','trash','download','submitjob')
        # )
        # SELECT json_build_object(
        # 'data',
        # COALESCE(
        #     json_agg(
        #     json_build_object(
        #         'timestamp',   e.timestamp,
        #         'portal',      e.portal,
        #         'username',    e.username,
        #         'action',      e.action,
        #         'tracking_id', e.tracking_id,
        #         'data',        e.data::json
        #     )
        #     ORDER BY e.timestamp, e.tracking_id, e.action
        #     ),
        #     '[]'::json
        # )
        # ) AS payload
        # FROM events e;
        # """

        # query = """
        # SELECT timestamp, portal, username, action, tracking_id, data
        # FROM public.portal_audit
        # WHERE tracking_id = (
        # SELECT tracking_id
        # FROM public.portal_audit
        # WHERE (lower(action) = 'upload' OR lower(action) = 'submitjob')
        #     AND data::text ILIKE %s
        # ORDER BY timestamp DESC
        # LIMIT 1
        # )
        # AND action IN ('upload','rename','move','trash','download','submitJob')
        # ORDER BY timestamp ASC;
        # """


        # endregion

        query = """
        WITH hits AS (
        SELECT DISTINCT tracking_id
        FROM public.portal_audit
        WHERE data::text ILIKE %s
        ),
        events AS (
        SELECT pa.session_id, pa.timestamp, pa.portal, pa.username,
                pa.action, pa.tracking_id, pa.data
        FROM public.portal_audit pa
        JOIN hits h ON h.tracking_id = pa.tracking_id
        WHERE lower(pa.action) IN ('upload','rename','move','trash','submitjob')
        )
        SELECT e.timestamp, e.portal, e.username, e.action, e.tracking_id, e.data
        FROM events e
        ORDER BY e.timestamp, e.tracking_id, e.action;
        """
        #order changed from timestamp first, then tracking id, then action -- change more convinient as it will now group together tracking_ids  or idk need feedback on that, no nvm bad idea



        pattern = f"%{filename}%"
        cursor.execute(query, [pattern])
        print(cursor.description)
        columns = [col[0] for col in cursor.description]
        results = [dict(zip(columns, row)) for row in cursor.fetchall()]
        cursor.close()
        print("Portal file search query successful.", flush=True)
        filteredRows = trace_file_portal_search(results, filename)
        #print(results, flush=True)
        return JsonResponse({"data": filteredRows}, json_dumps_params={"indent": 2, "ensure_ascii": False})
    except DatabaseError as exc:
        print("Error in get_portal_file_audit_search:", str(exc))
        return JsonResponse({"error": str(exc)}, status=500)


def get_tapis_file_audit_search(request, filename):
    """
    Fetches audit records given filename from tapis files audit database
    """
    # TODO: Implement database query for file tracking on tapis DB side

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



#need to work on UI API 500 errro response when page is not loading ==== MUST

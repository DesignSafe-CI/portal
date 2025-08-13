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
    """Return only rows that touch the searched file, tracking renames/moves."""

    def as_dict(v):
        if isinstance(v, dict):
            return v
        if isinstance(v, str):
            try:
                return json.loads(v)
            except Exception:
                return {}
        return {}

    # examples
    def bn(p):
        return p.rstrip("/").split("/")[-1] if p else ""

    def looks_like_file(name: str) -> bool:
        return bool(name) and "." in name

    seed = (filename or "").strip()
    aliases = {seed.lower()} if seed else set()
    seed_lc = seed.lower()

    kept = []

    for r in rows:
        action = (r.get("action") or "").lower()
        raw_data = r.get("data")
        data = as_dict(raw_data)
        body = data.get("body", {}) if isinstance(data, dict) else {}

        path = str(data.get("path") or "")
        file_path = str(data.get("filePath") or "")
        src_path = str(body.get("path") or path or "")
        dest_path = str(body.get("dest_path") or body.get("trash_path") or path or "")
        file_name = str(body.get("file_name") or "")
        new_name = str(body.get("new_name") or "")

        # getting display and location, already in front-end so idk
        if action == "upload":
            display = file_name or bn(path)
            source, dest = "—", (path or "-")
        elif action == "rename":
            display = new_name or bn(path)
            source, dest = "—", (path or "-")
        elif action == "move":
            display = bn(path) or bn(src_path) or bn(dest_path)
            source, dest = (src_path or "—"), (dest_path or "-")
        elif action == "trash":
            display = bn(src_path) or bn(path)
            source, dest = (src_path or "—"), (body.get("trash_path") or "-")
        elif action == "download":
            display = bn(file_path) or bn(path)
            source, dest = "—", (path or "-")
        else:
            display = bn(path) or bn(file_path) or file_name or new_name
            source, dest = "—", (path or "-")

        # candidate names (only keeping file-like)
        candidates_raw = [
            file_name,
            new_name,
            bn(path),
            bn(file_path),
            bn(src_path),
            bn(dest_path),
            display,
        ]
        file_candidates = [
            c.lower() for c in candidates_raw if c and looks_like_file(c)
        ]

        relevant = any(c in aliases for c in file_candidates)

        if relevant:
            item = dict(r)
            item["filename"] = display or "-"
            item["location"] = f"{'—' if source == 'nan' else source} → {dest}"
            kept.append(item)

            aliases.update(file_candidates)

        else:
            if action == "upload" and looks_like_file(display):
                try:
                    raw_str = (
                        raw_data
                        if isinstance(raw_data, str)
                        else json.dumps(raw_data or "")
                    )
                except Exception:
                    raw_str = str(raw_data or "")
                if seed_lc and seed_lc in raw_str.lower():
                    aliases.add(display.lower())

    return kept


def get_portal_session_audit_search(request, username):
    """
    Fetches audit records for given username from portal audit database
    """
    try:
        audit_db = connections["audit"]
        cursor = audit_db.cursor()

        # TEST - "joyce_cywu"
        # query = """
        # SELECT session_id, timestamp, portal, username, action, tracking_id, data
        # FROM public.portal_audit
        # WHERE session_id = 'np0qhb1qf1p0vyphzpv1u6aosafszidk'
        # AND username = %s
        # ORDER BY timestamp ASC;
        #     """

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
        results = [dict(zip(columns, row)) for row in cursor.fetchall()]
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

        query = """
        SELECT timestamp, portal, username, action, tracking_id, data
        FROM public.portal_audit
        WHERE tracking_id = (
            SELECT tracking_id
            FROM public.portal_audit
            WHERE action = 'upload'
            AND data::text ILIKE %s
            LIMIT 1
        )
        AND tracking_id IS NOT NULL
        AND action IN ('upload', 'rename', 'move', 'trash', 'download')
        ORDER BY "timestamp" ASC;
        """

        pattern = f"%{filename}%"
        cursor.execute(query, [pattern])
        columns = [col[0] for col in cursor.description]
        results = [dict(zip(columns, row)) for row in cursor.fetchall()]
        cursor.close()
        print("Portal file search query successful.", flush=True)
        filteredRows = trace_file_portal_search(results, filename)
        print(filteredRows, flush=True)
        return JsonResponse({"data": filteredRows})
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

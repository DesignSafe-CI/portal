"""Views for the audit app."""

import json
import logging
from django.shortcuts import render
from django.http import JsonResponse
from django.db import connections, Error as DatabaseError
from django.contrib.auth.decorators import login_required

logger = logging.getLogger(__name__)

_MAX_INPUT_LEN = 512


def _validate_len_or_400(value, field_name):
    """Return 400 JsonResponse if value is not a reasonable length; else None."""
    if not isinstance(value, str):
        return JsonResponse({"error": f"Invalid {field_name}"}, status=400)
    trimmed = value.strip()
    if not trimmed or len(trimmed) > _MAX_INPUT_LEN:
        return JsonResponse({"error": f"Invalid {field_name}"}, status=400)
    return None


@login_required
def audit_trail(request):
    """
    Audit trail view - renders React component for audit functionality
    """
    context = {"title": "Audit Trail"}
    return render(request, "designsafe/apps/audit/audit_trail.html", context)


@login_required
def get_portal_session_audit_search(request, username):
    """
    Fetches audit records for given username from portal audit database
    """
    try:
        bad = _validate_len_or_400(username, "username")
        if bad:
            return bad
        audit_db = connections["audit"]
        cursor = audit_db.cursor()

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
        return JsonResponse({"data": results})
    except DatabaseError as exc:
        logger.exception("Error in get_portal_audit_search")
        return JsonResponse({"error": str(exc)}, status=500)


@login_required
def get_upload_portal_search(request, filename):
    """
    Fetches audit records given filename under "upload" action from portal audit database
    """
    try:
        bad = _validate_len_or_400(filename, "filename")
        if bad:
            return bad
        audit_db = connections["audit"]
        cursor = audit_db.cursor()

        query = """
        WITH upload_ids AS (
        SELECT DISTINCT tracking_id
        FROM public.portal_audit
        WHERE lower(action) = 'upload'
            AND lower(data->'body'->>'file_name') = lower(%s)
        )
        SELECT timestamp, portal, username, action, tracking_id, data
        FROM public.portal_audit
        WHERE tracking_id IN (SELECT tracking_id FROM upload_ids)
        AND lower(action) IN ('upload','rename','move', 'trash')
        ORDER BY timestamp ASC, tracking_id ASC;
        """

        cursor.execute(query, [filename])
        columns = [col[0] for col in cursor.description]
        results = [dict(zip(columns, row)) for row in cursor.fetchall()]
        cursor.close()

        for row in results:
            data_field = row.get("data")
            if isinstance(data_field, str):
                try:
                    row["data"] = json.loads(data_field)
                except (json.JSONDecodeError, TypeError):
                    pass

        filtered_results = portal_upload_file_trace(results, filename)
        return JsonResponse(
            {"data": filtered_results},
            json_dumps_params={"indent": 2, "ensure_ascii": False},
        )
    except DatabaseError as exc:
        logger.exception("Error in get_upload_portal_search")
        return JsonResponse({"error": str(exc)}, status=500)


@login_required
def get_rename_portal_search(request, filename):
    """
    Fetches audit records given filename under "rename" action from portal audit database
    """
    try:
        bad = _validate_len_or_400(filename, "filename")
        if bad:
            return bad
        audit_db = connections["audit"]
        cursor = audit_db.cursor()

        query = """
        WITH rename_ids AS (
        SELECT DISTINCT tracking_id
        FROM public.portal_audit
        WHERE lower(action) = 'rename'
            AND lower(data->'body'->>'new_name') = lower(%s)
        )
        SELECT timestamp, portal, username, action, tracking_id, data
        FROM public.portal_audit
        WHERE tracking_id IN (SELECT tracking_id FROM rename_ids)
        AND lower(action) IN ('upload','rename','move', 'trash')
        ORDER BY timestamp ASC, tracking_id ASC;
        """

        cursor.execute(query, [filename])
        columns = [col[0] for col in cursor.description]
        results = [dict(zip(columns, row)) for row in cursor.fetchall()]
        cursor.close()

        for row in results:
            data_field = row.get("data")
            if isinstance(data_field, str):
                try:
                    row["data"] = json.loads(data_field)
                except (json.JSONDecodeError, TypeError):
                    pass

        filtered_results = portal_rename_file_trace(results, filename)
        return JsonResponse(
            {"data": filtered_results},
            json_dumps_params={"indent": 2, "ensure_ascii": False},
        )
    except DatabaseError as exc:
        logger.exception("Error in get_rename_portal_search")
        return JsonResponse({"error": str(exc)}, status=500)


@login_required
def get_portal_file_combined_search(request, filename: str):
    """
    Combined search returns merged results of upload trace and rename trace,
    Response format: { "data": [ ...groups from upload..., ...groups from rename... ] }
    """
    bad = _validate_len_or_400(filename, "filename")
    if bad:
        return bad
    combined = []

    for resp in (
        get_upload_portal_search(request, filename),
        get_rename_portal_search(request, filename),
    ):
        try:
            if getattr(resp, "status_code", 200) == 200:
                payload = json.loads(resp.content or b"{}")
                combined.extend(payload.get("data", []))
        except ValueError:
            continue

    return JsonResponse(
        {"data": combined}, json_dumps_params={"indent": 2, "ensure_ascii": False}
    )


# pylint: disable=too-many-locals,too-many-branches,too-many-statements,too-many-nested-blocks
def portal_upload_file_trace(payload: json, filename: str):
    """
    Build upload-anchored timelines for a file.
    - Start a new group per unique directory containing a matching upload
    - Track aliases: directory (aliases_path) and filenames (aliases_filenames)
    - Add subsequent rename/move/trash when they match current directory and filename
    """
    if isinstance(payload, dict) and "data" in payload:
        data = payload.get("data") or []
    elif isinstance(payload, list):
        data = payload
    else:
        data = []

    flat_data = []
    if isinstance(data, list):
        for item in data:
            if isinstance(item, list):
                flat_data.extend(item)
            elif isinstance(item, dict):
                flat_data.append(item)

    filename = filename.lower()
    kept_rows = (
        []
    )  # list of dicts contataining what will be returned to the frontend, this is going to be like a list of dicts, like list1 containitng 5 dict entries, list2 containning 4 dict entries, and so on until no more data to look at, and all those lists put under keptRows list
    aliases_path = (
        []
    )  # list correlating with index on keptRows, ex if keptRows[0] has path "erikriv16/scratch/working", then aliasesPath will have the same as well, good way to keep track
    aliases_filenames = (
        []
    )  # list of lists correlating with index on keptRows, ex if keptRows[0] (first dict entry) has a rename row that has new name as fileRename.txt, that file name will be stored in aliasesFilename[0] as a list ['fileRename.txt', .....] - adn keep adding from there if more renames come along
    index = 0

    def get_path_without_filename(full_path):
        """Extract path without filename"""
        if not full_path or "." not in full_path.split("/")[-1]:
            return full_path
        return "/".join(full_path.rstrip("/").split("/")[:-1])

    def get_filename_from_path(full_path):
        return full_path.rstrip("/").split("/")[-1].lower()

    def normalize_dir_path(p):
        return (p or "").strip().strip("/").lower()

    for entry in flat_data:
        action = entry.get("action", "").lower()
        entry_data = entry.get("data", {})
        body = entry_data.get("body", {})
        path = entry_data.get("path", "")
        file_name = body.get("file_name", "").lower()

        if action == "upload" and file_name == filename:
            path_without_filename = normalize_dir_path(get_path_without_filename(path))
            if path_without_filename not in aliases_path:
                kept_rows.append([entry])
                aliases_path.append(path_without_filename)
                aliases_filenames.append([file_name])
                index = len(kept_rows) - 1
            else:
                index = aliases_path.index(path_without_filename)
                kept_rows[index].append(entry)

        elif action == "rename":
            path_without_filename = normalize_dir_path(get_path_without_filename(path))
            filename_from_path = get_filename_from_path(path)
            new_name = body.get("new_name", "").lower()

            # Check each alias group to see if this rename belongs to it
            for i, alias_dir in enumerate(aliases_path):
                if path_without_filename == alias_dir:
                    if filename_from_path in aliases_filenames[i]:
                        kept_rows[i].append(entry)
                        if new_name:
                            aliases_filenames[i].append(new_name)
                        index = i
                        break

        # if action is move, need to check if path without filename at end in corresponding aliasesPath, adn if filename at end of path in aliasesFilename, if it is, we add this row to keptRows to its correspoding list, and update aliasesPath to this path excluding the filename
        elif action == "move":
            path_without_filename = normalize_dir_path(get_path_without_filename(path))
            filename_from_path = get_filename_from_path(path)
            dest_path = body.get("dest_path", "")

            for i, alias_dir in enumerate(aliases_path):
                if (
                    path_without_filename == alias_dir
                    and filename_from_path in aliases_filenames[i]
                ):
                    kept_rows[i].append(entry)
                    aliases_path[i] = normalize_dir_path(dest_path)
                    index = i
                    break

        elif action == "trash":
            path_without_filename = normalize_dir_path(get_path_without_filename(path))
            filename_from_path = get_filename_from_path(path)
            trash_path = body.get("trash_path", "")

            for i, alias_dir in enumerate(aliases_path):
                if (
                    path_without_filename == alias_dir
                    and filename_from_path in aliases_filenames[i]
                ):
                    kept_rows[i].append(entry)
                    if trash_path:
                        aliases_path[i] = normalize_dir_path(trash_path)
                    index = i
                    break

    return kept_rows


# pylint: disable=too-many-locals,too-many-branches,too-many-statements,too-many-nested-blocks
def portal_rename_file_trace(payload: json, filename: str):
    """
    Build rename-anchored timelines for a file.
    - Find rename rows whose body.new_name matches the searched filename
    - Walk backward through renames to resolve the original name
    - Prefer upload-style grouping over all rows for that origin
    - Fallback: build a chain using filename aliases across rename/move/trash
    """

    if isinstance(payload, dict) and "data" in payload:
        data = payload.get("data") or []
    elif isinstance(payload, list):
        data = payload
    else:
        data = []

    flat_data = []
    if isinstance(data, list):
        for item in data:
            if isinstance(item, list):
                flat_data.extend(item)
            elif isinstance(item, dict):
                flat_data.append(item)

    # target filename we are tracing
    target = (filename or "").lower()

    def get_filename_from_path(full_path):
        return (full_path or "").rstrip("/").split("/")[-1].lower()

    def is_rename_target(row, name):
        if (row.get("action") or "").lower() != "rename":
            return False
        data = row.get("data") or {}
        body = data.get("body", {}) or {}
        return (body.get("new_name") or "").lower() == name

    def resolve_origin_from_index(hit_index):
        current = target
        for j in range(hit_index, -1, -1):
            row_j = flat_data[j]
            if (row_j.get("action") or "").lower() != "rename":
                continue
            data_j = row_j.get("data") or {}
            body_j = data_j.get("body", {}) or {}
            if (body_j.get("new_name") or "").lower() == current:
                previous = get_filename_from_path(data_j.get("path", ""))
                if previous:
                    current = previous
        return current

    def extract_origin_from_group(group):
        if not group:
            return ""
        first = group[0]
        data0 = first.get("data") or {}
        if not isinstance(data0, dict):
            try:
                data0 = json.loads(data0)
            except ValueError:
                data0 = {}
        body0 = data0.get("body", {}) or {}
        file_from_body = (body0.get("file_name") or "").lower()
        if file_from_body:
            return file_from_body
        return get_filename_from_path(data0.get("path", ""))

    def build_alias_chain(origin):
        aliases_filename = {origin}
        chain = []
        for row in flat_data:
            action = (row.get("action") or "").lower()
            data_obj = row.get("data") or {}
            if not isinstance(data_obj, dict):
                try:
                    data_obj = json.loads(data_obj)
                except ValueError:
                    data_obj = {}
            body_obj = data_obj.get("body", {}) or {}
            if action == "rename":
                old = get_filename_from_path(data_obj.get("path", ""))
                if old in aliases_filename:
                    chain.append(row)
                    new_name = (body_obj.get("new_name") or "").lower()
                    if new_name:
                        aliases_filename.add(new_name)
            elif action in ("move", "trash"):
                base_name = get_filename_from_path(
                    data_obj.get("path") or body_obj.get("path") or ""
                )
                if base_name in aliases_filename:
                    chain.append(row)
        return chain

    # find rename targets and resolve origins
    rename_hit_indexes = []
    for i, row in enumerate(flat_data):
        if is_rename_target(row, target):
            rename_hit_indexes.append(i)
    origins = set()
    for i in rename_hit_indexes:
        origin = resolve_origin_from_index(i)
        if origin:
            origins.add(origin)

    # Prefer upload-style grouping for each origin
    result_groups = []
    seen_keys = set()
    for origin in origins:
        groups = portal_upload_file_trace(flat_data, origin) or []
        for g in groups:
            if not g:
                continue
            first = g[0]
            first_data = first.get("data") or {}
            if not isinstance(first_data, dict):
                try:
                    first_data = json.loads(first_data)
                except ValueError:
                    first_data = {}
            first_path = (
                first_data.get("path")
                or (first_data.get("body", {}) or {}).get("path")
                or ""
            )
            key = (first.get("tracking_id"), first.get("timestamp"), first_path)
            if key in seen_keys:
                continue
            seen_keys.add(key)
            result_groups.append(g)

    # fallback to alias chain if no upload-based group covered this origin
    covered_origins = set()
    for g in result_groups:
        covered_origins.add(extract_origin_from_group(g))
    for origin in origins:
        if origin in covered_origins:
            continue
        chain = build_alias_chain(origin)
        if chain:
            first = chain[0]
            first_data = first.get("data") or {}
            if not isinstance(first_data, dict):
                try:
                    first_data = json.loads(first_data)
                except ValueError:
                    first_data = {}
            first_path = (
                first_data.get("path")
                or (first_data.get("body", {}) or {}).get("path")
                or ""
            )
            key = (first.get("tracking_id"), first.get("timestamp"), first_path)
            if key not in seen_keys:
                seen_keys.add(key)
                result_groups.append(chain)

    return result_groups


@login_required
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
        logger.exception("Error in get_usernames_portal")
        return JsonResponse({"error": str(exc)}, status=500)

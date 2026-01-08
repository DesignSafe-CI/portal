"""Views for the audit app."""

import json
import logging
from django.shortcuts import render
from django.http import JsonResponse
from django.db import connections, Error as DatabaseError
from django.contrib.auth.decorators import login_required

logger = logging.getLogger(__name__)

_MAX_INPUT_LEN = 512


def validate_len_or_400(value, field_name):
    """Return 400 JsonResponse if value is not a reasonable length; else None."""
    if not isinstance(value, str) or len(value.strip()) <= 0 or len(value.strip()) > _MAX_INPUT_LEN:
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
        bad = validate_len_or_400(username, "username")
        if bad:
            return bad
        trail_audit_db = connections["trail_audit"]
        cursor = trail_audit_db.cursor()

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
        logger.exception("Error in get_portal_session_audit_search")
        return JsonResponse({"error": str(exc)}, status=500)


@login_required
def get_upload_portal_search(request, filename, username=None):
    """
    Fetches audit records given filename under "upload" action from portal audit database
    Optionally filters by username if provided
    """
    try:
        bad = validate_len_or_400(filename, "filename")
        if bad:
            return bad
        trail_audit_db = connections["trail_audit"]
        cursor = trail_audit_db.cursor()

        if username:
            query = """
            WITH upload_ids AS (
            SELECT DISTINCT tracking_id
            FROM public.portal_audit
            WHERE lower(action) = 'upload'
                AND lower(data->'body'->>'file_name') = lower(%s)
                AND username = %s
            )
            SELECT timestamp, portal, username, action, tracking_id, data
            FROM public.portal_audit
            WHERE tracking_id IN (SELECT tracking_id FROM upload_ids)
            AND lower(action) IN ('upload','rename','move', 'trash', 'submitjob')
            AND username = %s
            ORDER BY timestamp ASC, tracking_id ASC;
            """
            cursor.execute(query, [filename, username, username])
        else:
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
            AND lower(action) IN ('upload','rename','move', 'trash', 'submitjob')
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
def get_rename_portal_search(request, filename, username=None):
    """
    Fetches audit records given filename under "rename" action from portal audit database
    Optionally filters by username if provided
    """
    try:
        bad = validate_len_or_400(filename, "filename")
        if bad:
            return bad
        trail_audit_db = connections["trail_audit"]
        cursor = trail_audit_db.cursor()

        if username:
            query = """
            WITH rename_ids AS (
            SELECT DISTINCT tracking_id
            FROM public.portal_audit
            WHERE lower(action) = 'rename'
                AND lower(data->'body'->>'new_name') = lower(%s)
                AND username = %s
            )
            SELECT timestamp, portal, username, action, tracking_id, data
            FROM public.portal_audit
            WHERE tracking_id IN (SELECT tracking_id FROM rename_ids)
            AND lower(action) IN ('upload','rename','move', 'trash', 'submitjob')
            AND username = %s
            ORDER BY timestamp ASC, tracking_id ASC;
            """
            cursor.execute(query, [filename, username, username])
        else:
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
            AND lower(action) IN ('upload','rename','move', 'trash', 'submitjob')
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
    Combined search returns upload and rename based timelines combined into one with additional fields for frontend
    Optionally filters by username if provided as query parameter
    """
    username = request.GET.get("username", "").strip() or None

    combined_groups = []
    for resp in (
        get_upload_portal_search(request, filename, username),
        get_rename_portal_search(request, filename, username),
    ):
        payload = json.loads(resp.content)
        combined_groups.extend(payload.get("data", []))

    # adding header information to each timeline for easier frontend display
    timelines = []
    for idx, events in enumerate(combined_groups, start=1):
        if not events:
            continue

        first = events[0]
        last = events[-1]
        first_data = first.get("data")
        first_body = first_data.get("body", {})
        path = first_data.get("path") or first_body.get("path")
        timeline_file_name = first_body.get("file_name") or first_body.get(
            "new_name"
        )  # first item has to be upload or rename row

        timelines.append(
            {
                "id": idx,
                "timeline_file_name": timeline_file_name,
                "first_appearance": first.get("timestamp"),
                "last_activity": last.get("timestamp"),
                "event_count": len(events),
                "user": first.get("username"),
                "host": first_data.get("system"),
                "path": path,
                "events": [
                    {
                        "timestamp": entry.get("timestamp"),
                        "action": entry.get("action"),
                        "username": entry.get("username"),
                        "tracking_id": entry.get("tracking_id"),
                        "details": entry.get("data"),
                    }
                    for entry in events
                ],
            }
        )

    payload = {"file_name": filename, "timelines": timelines}
    payload = add_tapis_fields_to_timelines(payload)
    return JsonResponse(payload, json_dumps_params={"indent": 2, "ensure_ascii": False})


def portal_upload_file_trace(payload: list, filename: str):
    """
    Build upload-anchored timelines for a file.
    - Start a new group per unique directory containing a matching upload
    - Track aliases: Events are only grouped if they match the tracking ID (aliases_tracking_ids), current path(aliases_path), and filename(aliases_filenames).
    - Add subsequent upload/rename/move/trash/submitjob events when they match tracking ID, current directory, and filename
    """

    if not isinstance(payload, list):
        payload = []

    flat_data = payload
    target_filename = filename.lower()

    # --- Parallel Arrays ---
    kept_rows = []
    aliases_path = []
    aliases_filenames = []
    aliases_tracking_ids = []

    def get_path_without_filename(full_path):
        """Get directory path without filename: '/a/b/file.txt' -> '/a/b'"""
        if not full_path or "." not in full_path.split("/")[-1]:
            return full_path
        return "/".join(full_path.rstrip("/").split("/")[:-1])

    def get_filename_from_path(full_path):
        """Get filename from path: '/a/b/file.txt' -> 'file.txt'"""
        return full_path.rstrip("/").split("/")[-1].lower()

    def normalize_dir_path(path):
        """Normalize path for comparison: '/A/B/' -> '/a/b'"""
        return (path or "").strip().strip("/").lower()

    for entry in flat_data:
        action = entry.get("action", "").lower()
        entry_tracking_id = entry.get("tracking_id")

        data = entry.get("data", {})
        path = data.get("path", "")
        body = data.get("body", {})
        file_name = body.get("file_name", "").lower()

        # ---------------------------------------------------------
        # ACTION: UPLOAD
        # ---------------------------------------------------------
        if action == "upload" and file_name == target_filename:
            path_without_filename = normalize_dir_path(get_path_without_filename(path))

            # Try to find an existing match to append to
            match_found = False
            for i, alias_dir in enumerate(aliases_path):
                # Check tracking_id, path, and filename
                if (
                    entry_tracking_id == aliases_tracking_ids[i]
                    and path_without_filename == alias_dir
                    and file_name in aliases_filenames[i]
                ):

                    kept_rows[i].append(entry)
                    match_found = True
                    break

            # If no match found, start a new timeline
            if not match_found:
                kept_rows.append([entry])
                aliases_path.append(path_without_filename)
                aliases_filenames.append([file_name])
                aliases_tracking_ids.append(entry_tracking_id)

        # ---------------------------------------------------------
        # ACTION: RENAME
        # ---------------------------------------------------------
        elif action == "rename":
            path_without_filename = normalize_dir_path(get_path_without_filename(path))
            filename_from_path = get_filename_from_path(path)
            new_name = body.get("new_name", "").lower()

            for i, alias_dir in enumerate(aliases_path):
                # Check: path matches AND filename in list AND tracking_id matches
                if (
                    path_without_filename == alias_dir
                    and filename_from_path in aliases_filenames[i]
                    and entry_tracking_id == aliases_tracking_ids[i]
                ):

                    kept_rows[i].append(entry)
                    if new_name:
                        aliases_filenames[i].append(new_name)
                    break

        # ---------------------------------------------------------
        # ACTION: MOVE
        # ---------------------------------------------------------
        elif action == "move":
            path_without_filename = normalize_dir_path(get_path_without_filename(path))
            filename_from_path = get_filename_from_path(path)
            dest_path = body.get("dest_path", "")

            for i, alias_dir in enumerate(aliases_path):
                # Check: path matches AND filename in list AND tracking_id matches
                if (
                    path_without_filename == alias_dir
                    and filename_from_path in aliases_filenames[i]
                    and entry_tracking_id == aliases_tracking_ids[i]
                ):

                    kept_rows[i].append(entry)
                    aliases_path[i] = normalize_dir_path(dest_path)
                    break

        # ---------------------------------------------------------
        # ACTION: TRASH
        # ---------------------------------------------------------
        elif action == "trash":
            path_without_filename = normalize_dir_path(get_path_without_filename(path))
            filename_from_path = get_filename_from_path(path)
            trash_path = body.get("trash_path", "")

            for i, alias_dir in enumerate(aliases_path):
                # Check: path matches AND filename in list AND tracking_id matches
                if (
                    path_without_filename == alias_dir
                    and filename_from_path in aliases_filenames[i]
                    and entry_tracking_id == aliases_tracking_ids[i]
                ):

                    kept_rows[i].append(entry)
                    if trash_path:
                        aliases_path[i] = normalize_dir_path(trash_path)
                    break

        # ---------------------------------------------------------
        # ACTION: SUBMITJOB
        # ---------------------------------------------------------
        elif action == "submitjob":
            # Need to get sourceUrl from data.body.job.fileInputs
            files = data.get("body", {}).get("job", {}).get("fileInputs", [])
            if not files:
                continue

            source_url = (files[0].get("sourceUrl") or "").lower()
            if not source_url:
                continue

            for i, t_id in enumerate(aliases_tracking_ids):
                # For it to be added, tracking_id needs to match and sourceURl must contain file's current (most recent) name
                if t_id == entry_tracking_id and aliases_filenames[i][-1] in source_url:
                    kept_rows[i].append(entry)
                    break

    return kept_rows


def portal_rename_file_trace(payload: list, filename: str):
    """
    Trace a file history based on a rename event.
    1. Finds when the file was renamed to 'filename'.
    2. Traces backward to find the original filename.
    3. Runs the upload trace on that original filename.
    4. If it can't find nothing using upload trace uses fallback to build timeline.
    """
    if not isinstance(payload, list):
        return []

    target_name = (filename or "").lower()

    def get_filename_from_path(full_path):
        """Get filename from path: '/a/b/file.txt' -> 'file.txt'"""
        return full_path.rstrip("/").split("/")[-1].lower()

    # PHASE 1 recursevly find origin filname
    # We use a set to avoid processing the same origin file twice
    origins = set()

    for i, row in enumerate(payload):
        action = (row.get("action") or "").lower()
        body = row.get("data", {}).get("body", {}) or {}

        # Is this the rename event we are looking for?
        if action == "rename" and (body.get("new_name") or "").lower() == target_name:

            # Walk backward to find the original name
            # Start with the name we found (target_name) and trace it back
            current_name = target_name
            for j in range(i, -1, -1):
                prev_row = payload[j]
                prev_action = (prev_row.get("action") or "").lower()

                if prev_action == "rename":
                    prev_body = prev_row.get("data", {}).get("body", {}) or {}
                    # If this previous rename resulted in our current name
                    if (prev_body.get("new_name") or "").lower() == current_name:
                        # What the file used to be called one step back
                        old_name_in_path = get_filename_from_path(
                            prev_row.get("data", {}).get("path", "")
                        )
                        if old_name_in_path:
                            current_name = old_name_in_path

            origins.add(current_name)
    # region (Cool analogy from chatGPT that makes it easy to visualize the backwards chaining)

    # The Analogy: The "Name Tag" Chase
    # Imagine you are a detective. You have a stack of paperwork describing a suspect.
    # You are holding a sticky note in your hand that says: "TARGET: C.txt".
    # Your goal is to find out what this person's original birth name was.
    # You start at the bottom of the stack (the most recent event) and work your way up to the top.

    # The Paperwork (The Data)
    # Here is the stack of papers on your desk:

    # Paper #0 (Bottom / Oldest): "I, A.txt, am uploading my file."
    # Paper #1 (Middle): "I, A.txt, am changing my name to B.txt."
    # Paper #2 (Top / Newest): "I, B.txt, am changing my name to C.txt."

    # The Detective Work (The Loop)
    # You pick up the top paper (Paper #2) because you are looking for "C.txt".

    # Step 1: Analyzing Paper #2
    # You look at your sticky note: It says "TARGET: C.txt".
    # You read Paper #2: "I, B.txt, am changing my name to C.txt."
    # The Match: You say, "Aha! This paper explains how 'C.txt' got its name."
    # The Deduction: If the name became C.txt right here, then before this moment, the name must have been B.txt.
    # The Action (Crucial Step): You cross out "C.txt" on your sticky note. You write "TARGET: B.txt".
    # (Now you are no longer looking for C. You are looking for B, because finding B is the only way to get back to the start.)

    # Step 2: Analyzing Paper #1
    # You look at your sticky note: It now says "TARGET: B.txt".
    # You read Paper #1: "I, A.txt, am changing my name to B.txt."
    # The Match: You say, "Aha! This paper explains how 'B.txt' got its name."
    # The Deduction: If the name became B.txt right here, then before this moment, the name must have been A.txt.
    # The Action: You cross out "B.txt" on your sticky note. You write "TARGET: A.txt".

    # Step 3: Analyzing Paper #0
    # You look at your sticky note: It now says "TARGET: A.txt".
    # You read Paper #0: "I, A.txt, am uploading my file."
    # The Check: Is this a name change? No. It's an upload.
    # Action: You stop.
    # Result: The name written on your sticky note is "A.txt". You found the birth name!
    # Now, mapping this back to the Code
    # That "Sticky Note" in your hand? That is the variable current_name.

    # Here is the exact code with the "Sticky Note" logic explained:

    # Python Code Example

    # # 1. Start with the sticky note saying "C.txt"
    # current_name = target_name

    # # 2. Loop backwards through the papers (Index 2 -> 1 -> 0)
    # for j in range(i, -1, -1):

    # # 3. Read the paper
    # prev_row = payload[j]
    # new_name_on_paper = prev_row['data']['body']['new_name'] # e.g., "C.txt"
    # old_name_on_paper = prev_row['data']['path']             # e.g., "B.txt"

    # # 4. DOES THIS PAPER MATCH MY STICKY NOTE?
    # # Does the "New Name" on the paper match "current_name"?
    # if new_name_on_paper == current_name:

    #     # 5. YES! UPDATE THE STICKY NOTE.
    #     # Erase current_name. Replace it with the old name from the paper.
    #     current_name = old_name_on_paper

    # endregion

    # PHASE 2 trace using primary trace function
    final_groups = []
    seen_keys = set()

    # Tracking which origins were successfully handled by the upload trace fn
    covered_origins = set()

    for origin in origins:
        groups = portal_upload_file_trace(payload, origin) or []

        if groups:
            covered_origins.add(origin)
            for group in groups:
                # Create a unique key for this timeline to avoid duplicates
                if not group:
                    continue
                first = group[0]
                key = (
                    first.get("tracking_id"),
                    first.get("timestamp"),
                    first.get("data", {}).get("path"),
                )

                if key not in seen_keys:
                    seen_keys.add(key)
                    final_groups.append(group)

    # PHASE 3 Fallback Safety Net
    # For when no upload logic is found, manually build out a chain (for now I got it to only rename/move/trash need to add submitJob)
    remaining_origins = origins - covered_origins

    for origin in remaining_origins:
        chain = []
        # Set of all names this file has held
        aliases = {origin}

        for row in payload:
            action = (row.get("action") or "").lower()
            data = row.get("data") or {}
            body = data.get("body") or {}
            path = data.get("path") or ""
            filename_in_path = get_filename_from_path(path)

            if action == "rename":
                # If the file being renamed is in our alias list
                if filename_in_path in aliases:
                    chain.append(row)
                    # Add the new name to our known aliases
                    new_name = (body.get("new_name") or "").lower()
                    if new_name:
                        aliases.add(new_name)

            elif action in ("move", "trash"):
                # If the file being moved/trash is in our alias list
                if filename_in_path in aliases:
                    chain.append(row)

        if chain:
            # Add to results (deduplicated)
            first = chain[0]
            key = (
                first.get("tracking_id"),
                first.get("timestamp"),
                first.get("data", {}).get("path"),
            )
            if key not in seen_keys:
                seen_keys.add(key)
                final_groups.append(chain)

    return final_groups


@login_required
def get_usernames_portal(request):
    """
    Updating array with usernames for search
    """
    try:
        trail_audit_db = connections["trail_audit"]
        cursor = trail_audit_db.cursor()

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


def add_tapis_fields_to_timelines(payload: dict):
    """
    Insert TAPIS events in the events array right after submitJob events
    """
    timelines = payload.get("timelines", [])
    for timeline in timelines:
        events = timeline.get("events", [])
        if not events:
            continue

        filename = timeline.get("timeline_file_name")
        # Creating new_events, adding all old events but everytime we get a
        # submitJob event we add tapis events right after it
        new_events = []

        for event in events:
            # Add the current event to the new list
            new_events.append(event)

            action = event.get("action", "").lower()
            if action == "submitjob":
                tracking_id = event.get("tracking_id")
                if tracking_id and filename:
                    job_entries = get_job_info_by_tracking_id(tracking_id, filename)

                    # Setting this var so we can set collapseable area on frontend - i don't think I'll have time to do this
                    # Set that var or just check timeline event if details field looks different from portal ones
                    # then end if off when details field goes back to portal event format
                    event["details"]["has_tapis_events"] = bool(job_entries)

                    # Convert each TAPIS event into a timeline event and insert it
                    # Creating it like this so it resembles and stays consistent with portal events
                    for tapis_event in job_entries:
                        details = {
                            k: v
                            for k, v in tapis_event.items()
                            if k
                            not in [
                                "writer_logtime",
                                "action",
                                "obo_user",
                                "tracking_id",
                            ]
                        }

                        timeline_event = {
                            "timestamp": tapis_event.get("writer_logtime", ""),
                            "action": tapis_event.get("action", ""),
                            "username": tapis_event.get("obo_user", ""),
                            "tracking_id": tapis_event.get("tracking_id"),
                            "details": details,  # if we would pass tapis_event here, it would have duplicates
                        }
                        new_events.append(timeline_event)

                else:
                    event["details"]["has_tapis_events"] = False

        # Replace the old events list with the new one
        timeline["events"] = new_events
        # Updating event count including TAPIS events now
        timeline["event_count"] = len(new_events)

    return payload


def get_job_info_by_tracking_id(tracking_id: str, filename: str):
    """
    Query database/API using tracking_id to get job information.
    Returns dict with job data to be added to submitJob event.
    """
    try:
        trail_audit_db = connections["trail_audit"]
        cursor = trail_audit_db.cursor()

        # For a quick test, use test filename_pattern here instead of the one below, change
        # change all instaces of "tapis_files_audit" to "tapis_files_audit_staging", and search
        # by filename "download (11).zip"
        # test_filename = "file_ABC_XYZ.txt"
        # filename_pattern = f"%{test_filename}%"

        query = """
        WITH job_row AS (
            SELECT tracking_id
            FROM tapis_files_audit
            WHERE parent_tracking_id = %s
              AND tracking_id LIKE 'jobs.%%'
            ORDER BY writer_logtime ASC
            LIMIT 1
        )
        SELECT
            t.writer_logtime,
            t.action,
            t.obo_user,
            t.target_system_id,
            t.target_host,
            t.target_path,
            t.source_system_id,
            t.source_host,
            t.source_path,
            t.tracking_id,
            t.parent_tracking_id
        FROM tapis_files_audit t
        JOIN job_row jr ON TRUE
        WHERE
            (
                t.parent_tracking_id = %s
                OR t.parent_tracking_id = jr.tracking_id
                OR t.tracking_id = jr.tracking_id
            )
            AND (
                t.source_path ILIKE %s
                OR t.target_path ILIKE %s
            )
        ORDER BY t.writer_logtime ASC;
        """

        filename_pattern = f"%{filename}%"
        cursor.execute(
            query, [tracking_id, tracking_id, filename_pattern, filename_pattern]
        )

        columns = [col[0] for col in cursor.description]
        results = [dict(zip(columns, row)) for row in cursor.fetchall()]
        cursor.close()

        return results
    except DatabaseError as _:
        logger.exception("Error in get_job_info_by_tracking_id")
        return []

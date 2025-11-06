"""Workspace API Utils"""

import json
from typing import Union
from tapipy.tapis import TapisResult


def get_tapis_timeout_error_messages(job_id):
    """Return list of Tapis error messages for a give job uuid due to timeouts"""
    return [
        "JOBS_EARLY_TERMINATION Job terminated by Tapis because: TIME_EXPIRED",
        f'JOBS_USER_APP_FAILURE The user application ({job_id}) ended with remote status "TIMEOUT" and returned exit code: 0:0.',
    ]


def _get_job_notes(job_notes: Union[str, TapisResult]):
    """
    Normalize `job.notes` as in older version of Tapis `notes` is a JSON-formatted string
    but this is being changed to a TapisResult object. Once all tenants are migrated to
    return structured (non-string) 'notes', this can be
    removed
    """
    if isinstance(job_notes, str):
        return json.loads(job_notes)
    return job_notes


def check_job_for_timeout(job):
    """
    Check an interactive job for timeout status and mark it as finished
    since Tapis does not have native support for interactive jobs yet
    """

    if hasattr(job, "notes"):
        notes = _get_job_notes(job.notes)

        is_failed = job.status == "FAILED"
        is_interactive = notes.get("isInteractive", False)
        has_timeout_message = job.lastMessage in get_tapis_timeout_error_messages(
            job.remoteJobId
        )

        if is_failed and is_interactive and has_timeout_message:
            job.status = "FINISHED"
            job.remoteOutcome = "FINISHED"

    return job

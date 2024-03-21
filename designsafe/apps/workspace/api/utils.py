import json


def get_tapis_timeout_error_messages(job_id):
    return [
        "JOBS_EARLY_TERMINATION Job terminated by Tapis because: TIME_EXPIRED",
        f'JOBS_USER_APP_FAILURE The user application ({job_id}) ended with remote status "TIMEOUT" and returned exit code: 0:0.',
    ]


def check_job_for_timeout(job):
    """
    Check an interactive job for timeout status and mark it as finished
    since Tapis does not have native support for interactive jobs yet
    """

    if hasattr(job, "notes"):
        notes = json.loads(job.notes)

        is_failed = job.status == "FAILED"
        is_interactive = notes.get("isInteractive", False)
        has_timeout_message = job.lastMessage in get_tapis_timeout_error_messages(
            job.remoteJobId
        )

        if is_failed and is_interactive and has_timeout_message:
            job.status = "FINISHED"
            job.remoteOutcome = "FINISHED"

    return job

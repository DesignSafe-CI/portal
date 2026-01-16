"""Common context managers for use in views/tasks."""

from django.db import close_old_connections


class AsyncTaskContext:
    """
    Context manager to close database connections opened during execution of an
    async task.

    See: https://docs.djangoproject.com/en/4.2/ref/databases/#caveats
    """

    def __enter__(self):
        return None

    def __exit__(self, *args, **kwargs):
        close_old_connections()

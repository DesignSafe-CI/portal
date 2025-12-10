"""Common context managers for use in views/tasks."""

import os
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


class Workdir:
    """
    Context manager for changing the working directory. Used for constructing symlinks
    """

    def __init__(self, destination_dir):
        self.starting_dir = os.getcwd()
        self.destination_dir = destination_dir

    def __enter__(self):
        os.chdir(self.destination_dir)

    def __exit__(self, *args):
        os.chdir(self.starting_dir)

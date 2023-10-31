#!/usr/bin/env python
# pylint:disable=missing-module-docstring
import os
import sys

if __name__ == "__main__":
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "designsafe.settings")

    from django.core.management import execute_from_command_line

    # This will make sure the app is always imported when
    # Django starts so that shared_task will use this app.
    from designsafe.celery import app as celery_app  # pylint:disable=unused-import

    execute_from_command_line(sys.argv)

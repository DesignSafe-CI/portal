#!/usr/bin/env python
import os
import sys

if __name__ == "__main__":
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "designsafe.settings")

    from django.core.management import execute_from_command_line
    from django.conf import settings

    # This will make sure the app is always imported when
    # Django starts so that shared_task will use this app.
    from designsafe.celery import app as celery_app #pylint:disable=unused-import

    if settings.DEBUG:
        if os.environ.get("RUN_MAIN"):
            import debugpy

            debugpy.listen(("0.0.0.0", 5678))
            # debugpy.wait_for_client()

    execute_from_command_line(sys.argv)

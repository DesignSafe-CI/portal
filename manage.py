#!/usr/bin/env python
import os
import sys

if __name__ == "__main__":
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "designsafe.settings")

    from django.core.management import execute_from_command_line
    from django.conf import settings

    if settings.DEBUG:
        if os.environ.get("RUN_MAIN"):
            import debugpy

            debugpy.listen(("0.0.0.0", 5678))
            # debugpy.wait_for_client()

    execute_from_command_line(sys.argv)

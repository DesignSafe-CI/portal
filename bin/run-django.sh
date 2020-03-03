#!/usr/bin/env bash
source scl_source enable
# run django dev server as designsafe community account
/home/tg458981/portal_env/bin/python manage.py runserver 0.0.0.0:8000 2>&1 | \
    gawk -f /srv/www/designsafe/conf/docker/colorize_logs.awk --

#!/home/tg458981/portal_env/bin/dumb-init /bin/sh

##
# Run Celery task queue for development
#
/home/tg458981/portal_env/bin/celery -A designsafe beat -l info --pidfile= --schedule=/tmp/celerybeat-schedule 2>&1 | \
    gawk -f /srv/www/designsafe/conf/docker/colorize_logs.awk -- &
/home/tg458981/portal_env/bin/celery -A designsafe worker -l debug 2>&1 | \
    gawk -f /srv/www/designsafe/conf/docker/colorize_logs.awk --

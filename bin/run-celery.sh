#!/home/tg458981/portal_env/bin/dumb-init /bin/sh
source scl_source enable

# Run Celery as the DesignSafe Community Account
/home/tg458981/portal_env/bin/celery -A designsafe beat -l info --pidfile= --schedule=/tmp/celerybeat-schedule 2>&1 | \
    gawk -f /srv/www/designsafe/conf/docker/colorize_logs.awk -- &
/home/tg458981/portal_env/bin/celery -A designsafe worker -l info --autoscale=15,5 -Q indexing,files 2>&1 | \
    gawk -f /srv/www/designsafe/conf/docker/colorize_logs.awk -- &
/home/tg458981/portal_env/bin/celery -A designsafe worker -l info --autoscale=10,3 -Q default,api 2>&1 | \
    gawk -f /srv/www/designsafe/conf/docker/colorize_logs.awk -- 
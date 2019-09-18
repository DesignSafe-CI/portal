#!/home/tg458981/portal_env/bin/dumb-init /bin/sh
source scl_source enable

# Run Celery as the DesignSafe Community Account
/home/tg458981/portal_env/bin/celery -A designsafe beat -l info --pidfile= --schedule=/tmp/celerybeat-schedule &
/home/tg458981/portal_env/bin/celery -A designsafe worker -l info --autoscale=15,5 -Q indexing,files &
/home/tg458981/portal_env/bin/celery -A designsafe worker -l info --autoscale=10,3 -Q default,api

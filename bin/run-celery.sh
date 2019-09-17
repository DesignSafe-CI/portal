#!/opt/rh/rh-python36/root/usr/bin/dumb-init /bin/sh
source scl_source enable

# Run Celery as the DesignSafe Community Account
celery -A designsafe beat -l info --pidfile= --schedule=/tmp/celerybeat-schedule &
celery -A designsafe worker -l info --autoscale=15,5 -Q indexing,files &
celery -A designsafe worker -l info --autoscale=10,3 -Q default,api

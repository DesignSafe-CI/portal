#!/opt/rh/rh-python36/root/usr/bin/dumb-init /bin/sh

##
# Run Celery task queue for development
#
celery -A designsafe beat -l info --pidfile= --schedule=/tmp/celerybeat-schedule &
celery -A designsafe worker -l debug

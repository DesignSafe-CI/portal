#!/usr/bin/env bash

##
# Run Celery task queue for development
#
celery -A designsafe beat -l info --pidfile= --schedule=/tmp/celerybeat-schedule &
celery -A designsafe worker -l debug
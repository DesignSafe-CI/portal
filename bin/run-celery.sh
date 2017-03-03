#!/usr/bin/env bash

# Run Celery as the DesignSafe Community Account
su tg458981 -c "celery -A designsafe beat -l info --pidfile= --schedule=/tmp/celerybeat-schedule" &
su tg458981 -c "celery -A designsafe worker -l info --autoscale=10,2"

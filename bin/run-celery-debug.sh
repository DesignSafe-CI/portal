#!/bin/bash
#
# Run Celery task queue for development
#
celery -A designsafe worker -l info --autoreload

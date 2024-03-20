#!/usr/bin/env bash
# run django dev server as designsafe community account
python -m debugpy --listen 0.0.0.0:5678 manage.py runserver --noasgi 0.0.0.0:8000

#!/usr/bin/env bash

# run django dev server as designsafe community account
su tg458981 -c "python manage.py runserver 0.0.0.0:8000"

#!/usr/bin/env bash

# setup corral mount
mount 129.114.52.21:/corral-repl/tacc/NHERI /corral-repl/tacc/NHERI

# run django dev server as designsafe community account
su tg458981 -c "python manage.py runserver 0.0.0.0:8000"

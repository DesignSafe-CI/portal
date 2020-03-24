#!/usr/bin/env bash
source scl_source enable
# run django dev server as designsafe community account
python manage.py runserver 0.0.0.0:8000 

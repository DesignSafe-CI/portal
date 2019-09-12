#!/opt/app-root/bin/dumb-init /bin/sh

# run django dev server as designsafe community account
python manage.py runserver 0.0.0.0:8000

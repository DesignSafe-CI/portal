#!/opt/rh/rh-python36/root/usr/bin/dumb-init /bin/sh
source scl_source enable

# run django dev server as designsafe community account
python manage.py runserver 0.0.0.0:8000

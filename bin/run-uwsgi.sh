#!/opt/rh/rh-python36/root/usr/bin/dumb-init /bin/sh
source scl_source enable

/usr/local/bin/uwsgi --ini /portal/conf/uwsgi_websocket.ini

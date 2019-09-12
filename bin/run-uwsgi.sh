#!/opt/app-root/bin/dumb-init /bin/sh

/usr/local/bin/uwsgi --ini /portal/conf/uwsgi_websocket.ini

#!/home/tg548981/portal_env/bin/dumb-init /bin/sh
source scl_source enable

/usr/local/bin/uwsgi --ini /portal/conf/uwsgi_websocket.ini

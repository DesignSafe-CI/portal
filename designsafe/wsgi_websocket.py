"""
WSGI config for designsafe project websockets.

For more information on this file, see
https://django-websocket-redis.readthedocs.org/en/latest/running.html#django-with-websockets-for-redis-behind-nginx-using-uwsgi
"""

import os
import gevent.socket
import redis.connection
from ws4redis.uwsgi_runserver import uWSGIWebsocketServer


redis.connection.socket = gevent.socket
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "designsafe.settings")
application = uWSGIWebsocketServer()

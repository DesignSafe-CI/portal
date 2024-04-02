"""
ASGI config for designsafe project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/3.2/howto/deployment/asgi/
"""

import os

from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from django.core.asgi import get_asgi_application
from django.urls import re_path
from designsafe.apps.signals.websocket_consumers import DesignsafeWebsocketConsumer


os.environ.setdefault("DJANGO_SETTINGS_MODULE", "designsafe.settings")
websocket_urlpatterns = [
    re_path(r"ws/websockets/*$", DesignsafeWebsocketConsumer.as_asgi()),
]

application = ProtocolTypeRouter(
    {
        "http": get_asgi_application(),
        "websocket": AllowedHostsOriginValidator(
            AuthMiddlewareStack(URLRouter(websocket_urlpatterns))
        ),
    }
)

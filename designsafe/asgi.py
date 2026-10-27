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

from designsafe.celery import app as celery_app  # noqa

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "designsafe.settings")
asgi_app = get_asgi_application()

from django.conf import settings
from django.contrib.staticfiles.handlers import ASGIStaticFilesHandler

from designsafe.apps.api.publications_v2.websocket_consumers import (
    PublicationsRAGWebsocketConsumer,
)
from designsafe.apps.signals.websocket_consumers import DesignsafeWebsocketConsumer

if settings.DEBUG:
    asgi_app = ASGIStaticFilesHandler(asgi_app)


websocket_urlpatterns = [
    re_path(r"ws/websockets/*$", DesignsafeWebsocketConsumer.as_asgi()),
    re_path(r"ws/publications/*$", PublicationsRAGWebsocketConsumer.as_asgi()),
]


application = ProtocolTypeRouter(
    {
        "http": asgi_app,
        "websocket": AllowedHostsOriginValidator(
            AuthMiddlewareStack(URLRouter(websocket_urlpatterns))
        ),
    }
)

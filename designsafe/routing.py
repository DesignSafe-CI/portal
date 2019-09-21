"""Channels routing.

.. module: designsafe.routing
    :synopsis: Routing table for channels.
"""
from django.urls import path
from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from designsafe.apps.notifications.consumers import NotificationConsumer

# pylint: disable=invalid-name

application = ProtocolTypeRouter({
    "websocket": AuthMiddlewareStack(
        URLRouter([
            path('ws/websockets/', NotificationConsumer),
        ])
    )
})

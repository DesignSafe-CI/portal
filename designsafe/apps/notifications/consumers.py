"""Consumers for websockets.

.. module: designsafe.apps.notifications.consumers
    :synopsis: Consumers for websockets.
"""
import logging
import json
import urllib
from channels.generic.websocket import AsyncWebsocketConsumer


LOG = logging.getLogger(__name__)


class NotificationConsumer(AsyncWebsocketConsumer):
    """Main notification consumer.

    This consumer will accept any connection from a user that's authenticated.
    A group with the user's username will be created. We create a group
    because a single user could have multiple connections opened (multiple tabs opened).
    Every time a user created a connection django channels creates a unique channel (`channel_name`).
    This `channel_name` should only be used by django channels' internals. This is the reason
    why we create a group with the user's username. If we need to send a message to the user
    we use the group channel and we don't have to use the internal unique `channel_name`.

    .. note::
        This consumer will automatically add a user to two channel groups:
        - A channel group with the user's username as name.
        - A channel group named `"broadcast"`.

    .. example::
        If a message needs to be sent to the user then we can do this:
        ```python
        >>> from channels.layers import get_channel_layer
        >>> channel_layer = get_channel_layer()
        >>> channel_layer.group_send({
        ...     user.username,
        ...     {
        ...         "type":"user_message",
        ...         "message": {}
        ...     }
        ... )
        ```

        Use `"broadcast"` channel group to send a message
        to every connected user.
        For more information see :meth:`receive`

    """
    groups = ["broadcast"]

    async def connect(self):
        """Connect handler."""

        if not self.scope["user"].is_authenticated:
            await self.close()
        if self.scope["user"].username:
            await self.channel_layer.group_add(
                self.scope["user"].username,
                self.channel_name
            )

        qstr = urllib.parse.parse_qs(self.scope["query_string"])
        for group_name in qstr.get("groups", []):
            await self.channel_layer.group_add(
                group_name,
                self.channel_name
            )
        await self.accept()

    async def disconnect(self, close_code):
        """Disconnect handler."""
        if self.scope["user"].username:
            await self.channel_layer.group_discard(
                self.scope["user"].username,
                self.channel_name
            )

    async def receive(self, text_data):
        """Receive handler."""
        if not self.scope["user"].is_authenticated:
            return

        test_data_json = json.loads(text_data)
        message = test_data_json["message"]

        await self.channel_layer.group_send(
            self.scope["user"].username,
            {
                "type": "user_message",
                "message": message
            }
        )

    async def user_message(self, event):
        """Custom handler to send a message to user."""
        message = event["message"]

        await self.send(text_data=json.dumps({
            "message": message
        }))

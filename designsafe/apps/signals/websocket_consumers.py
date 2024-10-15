"""Websocket consumers"""

import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.layers import get_channel_layer


class DesignsafeWebsocketConsumer(AsyncWebsocketConsumer):
    """Websocket consumer for DesignSafe notifications"""

    async def connect(self):
        await self.channel_layer.group_add(
            f"ds_{self.scope['user']}", self.channel_name
        )
        await self.accept()

    async def disconnect(self, code):
        await self.channel_layer.group_discard(
            f"ds_{self.scope['user']}", self.channel_name
        )
        await self.channel_layer.group_discard("ds_broadcast", self.channel_name)

    async def receive(self, text_data=None, bytes_data=None):
        if text_data == "markAllNotificationsAsRead":
            channel_layer = get_channel_layer()
            await channel_layer.group_send(
                f"ds_{self.scope['user']}",
                {
                    "type": "ds_notification",
                    "message": json.dumps({"event_type": "markAllNotificationsAsRead"}),
                },
            )

    async def ds_notification(self, event):
        """Send notification to user"""
        message = event["message"]
        await self.send(text_data=message)

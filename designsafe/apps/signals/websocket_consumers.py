import json

from channels.generic.websocket import WebsocketConsumer, AsyncWebsocketConsumer


class DesignsafeWebsocketConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user_channel = f"ds_{self.scope['user']}"
        self.broadcast_channel = "ds_broadcast"
        await self.channel_layer.group_add(self.user_channel, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.user_channel, self.channel_name)
        await self.channel_layer.group_discard(
            self.broadcast_channel, self.channel_name
        )

    async def receive(self, text_data):
        pass

    async def ds_notification(self, event):
        message = event["message"]
        await self.send(text_data=message)

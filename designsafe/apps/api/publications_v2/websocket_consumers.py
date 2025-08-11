"""Websocket consumers"""

import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.layers import get_channel_layer

from designsafe.apps.api.publications_v2.agents.neo4j_rag_agent import neo4j_agent

logger = logging.getLogger(__name__)


class PublicationsRAGWebsocketConsumer(AsyncWebsocketConsumer):
    """Websocket consumer for DesignSafe notifications"""

    async def connect(self):
        await self.channel_layer.group_add(
            f"ds_rag_{self.scope['user']}", self.channel_name
        )
        await self.accept()

    async def disconnect(self, code):
        await self.channel_layer.group_discard(
            f"ds_rag_{self.scope['user']}", self.channel_name
        )

    async def receive(self, text_data=None, bytes_data=None):
        json_data = json.loads(text_data)
        message_type = json_data.get("type", "query")
        payload = json_data.get("payload", "")

        if message_type == "query":
            channel_layer = get_channel_layer()
            await channel_layer.group_send(
                f"ds_rag_{self.scope['user']}",
                {"type": "chat.message", "payload": payload},
            )

    async def chat_message(self, event):
        """Handle receipt of a chat message."""

        # await self.send(
        #             json.dumps({"type": "chat.response", "payload": "received message"})
        #         )
        # stream_response =  neo4j_agent.run_stream(event["payload"])
        # async with stream_response as result:
        #     async for text in result.stream(debounce_by=1):
        #         logger.debug(text)
        #         await self.send(
        #             json.dumps({"type": "chat.response", "payload": text})
        #         )

        response = await neo4j_agent.run(event["payload"])
        await self.send(
            json.dumps({"type": "chat.response", "payload": response.output})
        )

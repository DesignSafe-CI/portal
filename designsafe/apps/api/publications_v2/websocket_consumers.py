"""Websocket consumers"""

import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from designsafe.apps.api.publications_v2.agents.neo4j_rag_agent import (
    combined_agent as HybridSearchAgent,
)

logger = logging.getLogger(__name__)
metrics = logging.getLogger("metrics")


class PublicationsRAGWebsocketConsumer(AsyncWebsocketConsumer):
    """Websocket consumer for DesignSafe notifications"""

    async def connect(self):
        await self.accept()

    async def disconnect(self, code):
        pass

    async def receive(self, text_data=None, bytes_data=None):
        json_data = json.loads(text_data)
        message_type = json_data.get("type", "query")
        payload = json_data.get("payload", "")
        key = json_data.get("key", "")

        if message_type == "query":
            await self.chat_message(
                {"type": "chat.message", "payload": payload, "key": key}
            )

        if message_type == "feedback":
            session = self.scope["session"]
            user = self.scope["user"]
            ip_addr = self.scope["client"][0]

            metrics.info(
                "Chat",
                extra={
                    "agent": "",
                    "ip": ip_addr,
                    "operation": "chat.feedback",
                    "sessionId": getattr(session, "session_key", ""),
                    "user": getattr(user, "username"),
                    "info": {"value": payload, "history": json_data.get("history")},
                },
            )

    async def chat_message(self, event):
        """Handle receipt of a chat message."""

        try:
            stream_response = HybridSearchAgent.run_stream(event["payload"])

            async with stream_response as result:
                res = ""
                async for text in result.stream(debounce_by=1):
                    res = text
                    await self.send(
                        json.dumps(
                            {
                                "type": "chat.response",
                                "key": f"response-{event['key']}",
                                "payload": text,
                            }
                        )
                    )
                session = self.scope["session"]
                user = self.scope["user"]
                ip_addr = self.scope["client"][0]
                metrics.info(
                    "Chat",
                    extra={
                        "agent": "",
                        "ip": ip_addr,
                        "operation": "chat.response",
                        "sessionId": getattr(session, "session_key", ""),
                        "user": getattr(user, "username"),
                        "info": {"query": event["payload"], "response": res},
                    },
                )
        # pylint:disable=broad-exception-caught
        except Exception as exc:
            logger.debug(exc)
            await self.send(
                json.dumps(
                    {
                        "type": "chat.error",
                        "key": f"error-{event['key']}",
                        "payload": "An unexpected error occurred while processing your query.",
                    }
                )
            )

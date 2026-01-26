"""Websocket consumers"""

import json
import logging

from pydantic_ai.exceptions import ModelHTTPError
from channels.generic.websocket import AsyncWebsocketConsumer

# from designsafe.apps.api.publications_v2.agents.neo4j_rag_agent import neo4j_agent
from designsafe.apps.api.publications_v2.agents.openai_rag_agent import (
    agent as PubsAgent,
    AgentDeps,
)
from designsafe.apps.api.publications_v2.agents.docs_rag_agent import agent as DocsAgent
from designsafe.apps.api.publications_v2.agents.intent_agent import intent_agent

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

        # for i in range(10):
        #   await asyncio.sleep(1)
        #   await self.send(
        #       json.dumps({"type": "chat.response", "payload": f"received message {i}", "key": f"response-{event['key']}"})
        #   )

        async def response_callback(payload: str):
            await self.send(
                json.dumps(
                    {
                        "type": "chat.status",
                        "key": f"status-{event["key"]}",
                        "payload": payload,
                    }
                )
            )

        intent_result = await intent_agent.run(event["payload"])
        if intent_result.output == "documentation":
            agent = DocsAgent
        else:
            agent = PubsAgent

        try:
            stream_response = agent.run_stream(
                event["payload"],
                deps=AgentDeps(
                    response_callback=response_callback,
                    query=event["payload"],
                    result_size=10,
                ),
            )
            async with stream_response as result:
                async for text in result.stream(debounce_by=1):
                    await self.send(
                        json.dumps(
                            {
                                "type": "chat.response",
                                "key": f"response-{event["key"]}",
                                "payload": text,
                            }
                        )
                    )

        # pylint:disable=broad-exception-caught
        except ModelHTTPError as exc:
            logger.debug(exc.body["code"])
            if exc.body["code"] == "rate_limit_exceeded":
                await self.send(
                    json.dumps(
                        {
                            "type": "chat.error",
                            "key": f"error-{event["key"]}",
                            "payload": "Token limit exceeded. Retrying with reduced context...",
                        }
                    )
                )
            stream_response = agent.run_stream(
                event["payload"],
                deps=AgentDeps(
                    response_callback=response_callback,
                    query=event["payload"],
                    result_size=3,
                ),
            )
            async with stream_response as result:
                res = ""
                async for text in result.stream(debounce_by=1):
                    res = text
                    await self.send(
                        json.dumps(
                            {
                                "type": "chat.response",
                                "key": f"response-{event["key"]}",
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

        except Exception as exc:
            logger.debug(exc)
            await self.send(
                json.dumps(
                    {
                        "type": "chat.error",
                        "key": f"error-{event["key"]}",
                        "payload": "An unexpected error occurred while processing yoru query.",
                    }
                )
            )

        # response = await neo4j_agent.run(event["payload"])
        # await self.send(
        #    json.dumps({"type": "chat.response", "payload": response.output})
        # )

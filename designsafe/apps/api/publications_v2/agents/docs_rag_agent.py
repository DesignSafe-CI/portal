"""
Agent for documentation RAG
"""

import os
from collections.abc import Callable
import chromadb
from chromadb.config import Settings as ChromaSettings
import pydantic
from pydantic_ai import Agent
from pydantic_ai.models.openai import OpenAIResponsesModel
from pydantic_ai.providers.openai import OpenAIProvider

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
OPENAI_INFERENCE_MODEL = os.environ.get("OPENAI_INFERENCE_MODEL", "gpt-4o-mini")


chroma_client = chromadb.HttpClient(
    host="chromadb",
    port=8000,
    settings=ChromaSettings(anonymized_telemetry=False),
)
collection = chroma_client.get_collection("designsafe_docs")


class RagDocument(pydantic.BaseModel):
    """Class representing a docs section retrieved by RAG."""

    text: str
    url: str
    title: str


rag_model = OpenAIResponsesModel(
    OPENAI_INFERENCE_MODEL,
    provider=OpenAIProvider(
        api_key=os.environ.get("OPENAI_API_KEY"),
        base_url="https://api.openai.com/v1/",
    ),
)


class AgentDeps(pydantic.BaseModel):
    """Dependencies for the OpenAI RAG agent"""

    query: str
    result_size: int = 10
    response_callback: Callable


DOCS_RAG_INSTRUCTIONS = """
You are a research assistant with the task of assisting users with questions about documentation in the DesignSafe natural hazards research portal.
Cite your sources using the provided URLs. Provide detailed instructions and code samples where possible. 
Format responses in markdown with properly formatted code blocks.
"""

agent = Agent(rag_model, instrument=False, instructions=DOCS_RAG_INSTRUCTIONS)


@agent.tool_plain
def documentation_lookup(query: str) -> list[RagDocument]:
    """Tool to search documentation and retrieve relevant sections."""
    docs_res = []
    query_resp = collection.query(query_texts=[query])
    docs = query_resp["documents"][0]
    metas = query_resp["metadatas"][0]
    for text, meta in zip(docs, metas):
        docs_res.append(RagDocument(text=text, url=meta["url"], title=meta["title"]))

    return docs_res

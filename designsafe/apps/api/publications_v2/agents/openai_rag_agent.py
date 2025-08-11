"""RAG agent for retrieving publications from the OpenAI document store."""

import openai

from pydantic import BaseModel
from pydantic_ai import Agent
from pydantic_ai.models.openai import OpenAIModel
from pydantic_ai.providers.openai import OpenAIProvider

from django.conf import settings


OAI_VECTOR_STORE_ID = "vs_68891f2f54948191bd1053afdf542987"

oai_rag_client = openai.AsyncOpenAI(
    base_url=settings.OPENAI_API_URL, api_key=settings.OPENAI_API_KEY
)


class PublicationRagResult(BaseModel):
    """Model for documents retrieved from the OpenAI RAG store."""

    project_id: str
    citation_url: str
    text: str


model = OpenAIModel(
    "gpt-4o-mini",
    provider=OpenAIProvider(
        api_key=settings.OPENAI_API_KEY, base_url=settings.OPENAI_API_URL
    ),
)
agent = Agent(
    model,
    system_prompt=(
        "You are an agent tasked with answering user queries in the DesignSafe web portal.",
        "Cite all sources used with URLs. Pass the user's query to the vector_lookup tool. Call the vector_lookup tool EXACTLY once.",
        "explain how every source relates to the user's query. Ignore irrelevant sources."
        "DO NOT use the legacyPath attribute on files to construct URLs.",
        "If the question relates to attributes of a publication, DO NOT discuss publications that aren't relevant to those attributes.",
    ),
)


@agent.tool_plain
async def vector_lookup(query: str) -> list[PublicationRagResult]:
    """Look up publications in the OpenAI vector store."""
    ret = []
    res = await oai_rag_client.vector_stores.search(
        OAI_VECTOR_STORE_ID, query=query, max_num_results=20
    )
    for search_result in res.data:
        project_id = search_result.attributes.get("projectId")
        citation_url = f"https://www.designsafe-ci.org/data/browser/public/designsafe.storage.published/{project_id}"
        result_model = PublicationRagResult(
            project_id=project_id,
            citation_url=citation_url,
            text=search_result.content[0].text,
        )
        ret.append(result_model)

    return ret

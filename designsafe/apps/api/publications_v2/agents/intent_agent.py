"""RAG agent for retrieving publications from the OpenAI document store."""

from typing import Literal
import openai

from pydantic import BaseModel
from pydantic_ai import Agent
from pydantic_ai.models.openai import OpenAIModel
from pydantic_ai.providers.openai import OpenAIProvider


from django.conf import settings


oai_rag_client = openai.AsyncOpenAI(
    base_url=settings.OPENAI_API_URL, api_key=settings.OPENAI_API_KEY
)


class PublicationRagResult(BaseModel):
    """Model for documents retrieved from the OpenAI RAG store."""

    project_id: str
    citation_url: str
    text: str


OPENAI_MODEL = "gpt-4o-mini"
# OPENAI_MODEL="o4-mini"
# OPENAI_MODEL="gpt-4.1-nano"


model = OpenAIModel(
    OPENAI_MODEL,
    provider=OpenAIProvider(
        api_key=settings.OPENAI_API_KEY, base_url=settings.OPENAI_API_URL
    ),
)
intent_agent = Agent(
    model,
    instructions=(
        "You are a preprocessor in an agentic workflow. The user has entered a query and you will determine whether to route the query to 'publications' or 'documentation",
        "Route the query to 'publications if the user is looking for information about published projects or datasets, for example, if they are trying to find information about specific natural hazard events, people, or datasets",
        "Route the qeury to 'documentation' if the user is looking for help with the functionality of the DesignSafe portal, such as transferring files or running an application. If the user is asking HOW to do something, they should be routed to documentation.",
        "Route the qeury to 'documentation' if the user is asking a question about policy, such as whether a certain type of data can be published, or if a feature is supported.",
    ),
    output_type=Literal["publications", "documentation"],
)

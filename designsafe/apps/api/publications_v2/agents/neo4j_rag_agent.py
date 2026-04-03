"""RAG agent using Neo4J to construct queries."""

from asgiref.sync import sync_to_async
import openai
from pydantic_ai import Agent
from pydantic_ai.models.openai import OpenAIModel
from pydantic_ai.providers.openai import OpenAIProvider
from django.conf import settings
import neo4j

from designsafe.apps.api.publications_v2.agents.elasticsearch_agent import (
    perform_es_search,
    SearchHits,
)


EMBEDDING_MODEL = "text-embedding-ada-002"


async def get_embedding(client, text, embedding_model):
    """Obtain an embedding from OpenAI's embedding model."""
    response = await client.embeddings.create(
        input=text,
        model=embedding_model,
    )

    embedding = response.data[0].embedding
    return embedding


def get_driver_async() -> neo4j.AsyncDriver:
    """Instantiate an async neo4j client."""
    return neo4j.AsyncGraphDatabase.driver(
        settings.NEO4J_URL,
        auth=("neo4j", settings.NEO4J_PASS),
    )


oai_rag_client = openai.AsyncOpenAI(
    base_url=settings.OPENAI_API_URL, api_key=settings.OPENAI_API_KEY
)


model = OpenAIModel(
    "gpt-4o-mini",
    provider=OpenAIProvider(
        api_key=settings.OPENAI_API_KEY, base_url=settings.OPENAI_API_URL
    ),
)
neo4j_agent = Agent(
    model,
    system_prompt=(
        "You are an agent tasked with answering user queries in the DesignSafe web portal. "
        "If the query asks for a specific count or exhaustive list of results, THEN use the get_search_results_with_hits tool to get a list and count. "
        "As the argument to the get_search_results_with_hits tool, extract a list of names and proper nouns from the query, ignoring generic terms like 'dataset' "
        "If you run the get_search_results_with_hits tool, you should also run the neo4j_vector_lookup tool. "
        "extract relevant names and keywords from the query text, and call the neo4j_vector_lookup tool to find context for answering the user's query. "
        "Cite all sources used with URLs. DO NOT mention a source without linking to it. Pass the user's query to the neo4j_vector_lookup tool. "
        "DO NOT reference or link to individual files, instead provide a link to the publication's DOI. "
        "If the question specifies a date or name, DO NOT discuss publications that don't mention that date or proper noun. "
        "Finish your response after listing and explaining the relevant publications. Do not offer to continue the conversation."
    ),
)


@neo4j_agent.tool_plain
async def neo4j_vector_lookup(query: str) -> list[dict]:
    """Perform semantic search on a string to find related context in the vector database. THIS TOOL IS MANDATORY TO USE IF AVAILABLE"""
    ret = []

    query_embedding = await get_embedding(oai_rag_client, query, EMBEDDING_MODEL)

    async with get_driver_async() as driver:
        neo4j_query = """

            CALL () {
                CALL db.index.vector.queryNodes('designsafeEmbeddings', 10, $embedding)
                YIELD node, score
                WITH collect({node:node, score:score}) AS nodes, max(score) AS max
                UNWIND nodes AS n
                RETURN n.node AS node, (n.score / max) AS score
                UNION 
                CALL db.index.fulltext.queryNodes("embeddingFullText", $query, {limit: 10})
                YIELD node, score
                WITH collect({node:node, score:score}) AS nodes, max(score) AS max
                UNWIND nodes AS n
                RETURN n.node AS node, (n.score / max) AS score
            }
            WITH node, max(score) AS score ORDER BY score DESC LIMIT 10
            MATCH (node)<-[r*1..]-(parent)
            RETURN DISTINCT parent
            LIMIT 10

            """
        res = await driver.execute_query(
            neo4j_query, embedding=query_embedding, query=query
        )
        for record in res.records:
            ret.append(dict(record["parent"]))

    return ret


@neo4j_agent.tool_plain
async def get_search_results_with_hits(search_terms: list[str]) -> SearchHits:
    """
    This is an OPTIONAL tool that should be only be called after the neo4j_vector_lookup tool.
    Using a set of search terms, returns the search results from performing a full-text
    search using Elasticsearch, and counts the number of hits. This tool should be called
    when the user asks a question that requires a comprehensive search result.
    """
    return_val = await sync_to_async(perform_es_search)(search_terms)
    return return_val

"""RAG agent for retrieving publications from the OpenAI document store."""

from typing import Literal
from collections.abc import Callable
from asgiref.sync import sync_to_async
import networkx as nx
import openai

from pydantic import BaseModel
from pydantic_ai import Agent, RunContext
from pydantic_ai.models.openai import OpenAIModel
from pydantic_ai.providers.openai import OpenAIProvider

from elasticsearch_dsl import Q

from django.conf import settings
from designsafe.apps.api.publications_v2.elasticsearch import IndexedPublication


OAI_VECTOR_STORE_ID = "vs_68891f2f54948191bd1053afdf542987"

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


class AgentDeps(BaseModel):
    """Dependencies for the OpenAI RAG agent"""

    query: str
    result_size: int = 10
    response_callback: Callable


model = OpenAIModel(
    OPENAI_MODEL,
    provider=OpenAIProvider(
        api_key=settings.OPENAI_API_KEY, base_url=settings.OPENAI_API_URL
    ),
)
agent = Agent(
    model,
    instructions=(
        "You are an research assistant tasked with helping users explore natural hazards publications in the DesignSafe cyberinfrastructure.",
        "Cite all sources used with URLs. Pass the user's query VERBATIM to the vector_lookup tool. Call the vector_lookup tool EXACTLY once.",
        "ONLY discuss publications that directly relate to the user's query. ",
        "Include a 'Link' bullet point in each listed publication with a link to its URL. ",
        "ALWAYS include links verbatim. Do not truncate them or alter their formatting. ",
        # "ALWAYS explain in detail why each referenced publication was chosen. ",
        "DO NOT use the legacyPath attribute on files to construct URLs. ",
        "If the question relates to attributes of a publication, DO NOT discuss publications that aren't relevant to those attributes."
        """Construct keywords according to the following guidelines:
            1. Carefully read the entire query to understand its core topics and main ideas.
            2. Extract up to 6 relevant keywords or key phrases that accurately reflect the key concepts discussed in the query. ONLY use words or phrases directly mentioned in the query.
            3. If any keywords of key phrases are plural, add the singular form. If the keyword contains a number, include a version where the number is written out. For example if the keyword contains the character '1', write it out as 'one' and add it to the list.
            4. Key phrases can contain a maximum of 2 words separated by spaces.
            5. Avoid common stop words like "the", "and", or "with". Also, avoid overly generic terms unless they are critical to the topic.""",
        "Provide the full result link at the end so that users can access it to explore the full set of DesignSafe publications.",
    ),
)


@agent.instructions
def relevance_instruction(ctx: RunContext[AgentDeps]) -> str:
    """instruction for explaining how a result is relevant."""
    return f"Include a 'Relevance' bullet point in each listed publication explaining how it relates to the user input: '{ctx.deps.query}'"


class SearchParams(BaseModel):
    """Base class for search parameters extracted from a user query."""

    keywords: list[str]
    author_names: list[str]
    dates: list[str]


class CollatedSearchResult(BaseModel):
    """Model representing a RAG search result"""

    project_id: str
    dois: list[str]
    project_url: str
    associated_text: list[str]
    base_metadata: dict
    publication_metadata: list[dict]
    confidence: Literal["excellent", "good", "fair"]


class RetrievalSummary(BaseModel):
    """Final output from the RAG retrieval tool, including a list of documents,
    a total count, and a link to a more comprehensive search results page."""

    documents: list[CollatedSearchResult]
    count: int
    full_result_link: str


def get_es_results(search_params: SearchParams, max_num_results=10):
    """Get Elasticsearch results based on query params extracted from the user's query."""

    es_author_string = " OR ".join(
        [f"({author})" for author in search_params.author_names]
    )
    es_keyword_string = " OR ".join([f"({kw})" for kw in search_params.keywords])

    es_date_string = " OR ".join([f"({kw})" for kw in search_params.dates])

    non_empty_subqueries = [
        q for q in (es_author_string, es_keyword_string, es_date_string) if q
    ]

    combined_query_string = "AND".join([f"({q})" for q in non_empty_subqueries])

    # project_query = Q('query_string', query=es_project_string, default_operator='and')
    es_rag_query = Q(
        "query_string",
        query=combined_query_string,
        default_operator="and",
        minimum_should_match="50%",
        type="cross_fields",
    )

    search_results = (
        IndexedPublication.search()
        .filter(es_rag_query)
        .extra(size=max_num_results)
        .execute()
    )
    return combined_query_string, search_results


@agent.tool
# pylint:disable=too-many-locals
async def vector_lookup(
    ctx: RunContext[AgentDeps], query: str, search_params: SearchParams
) -> RetrievalSummary:
    """Look up publications in the OpenAI vector store."""

    await ctx.deps.response_callback(
        f"Performing lookup with the following parameters: {str(search_params)}"
    )

    vector_results: list[PublicationRagResult] = []
    res = await oai_rag_client.vector_stores.search(
        OAI_VECTOR_STORE_ID,
        query=query,
        max_num_results=ctx.deps.result_size,
        rewrite_query=True,
    )
    for search_result in res.data:
        project_id = search_result.attributes.get("projectId")
        citation_url = f"https://www.designsafe-ci.org/data/browser/public/designsafe.storage.published/{project_id}"
        result_model = PublicationRagResult(
            project_id=project_id,
            citation_url=citation_url,
            text=search_result.content[0].text,
        )
        vector_results.append(result_model)

    await ctx.deps.response_callback(
        "Publication lookup complete. Constructing your response..."
    )

    recovered_project_ids = set((res.project_id for res in vector_results))

    _, es_search_results = await sync_to_async(get_es_results)(
        search_params, max_num_results=ctx.deps.result_size
    )

    es_project_ids = set((hit.meta.id for hit in es_search_results.hits))

    hits_in_both = recovered_project_ids.intersection(es_project_ids)
    es_only = es_project_ids - recovered_project_ids

    all_hits = recovered_project_ids.union(es_project_ids)

    final_result = []
    all_hits_from_es = await sync_to_async(IndexedPublication.mget)(list(all_hits))
    for hit in all_hits_from_es:
        if not hit:
            continue
        project_id = hit.meta.id
        project_dict = hit.to_dict()
        base_meta = next(
            n for n in project_dict["nodes"] if n["name"] == "designsafe.project"
        )

        null_keys = [k for k in base_meta["value"].keys() if not base_meta["value"][k]]
        for null_key in null_keys:
            del base_meta["value"][null_key]

        project_tree: nx.DiGraph = nx.node_link_graph(project_dict)
        entities_with_dois = []
        dois = []
        for node in project_tree.successors("NODE_ROOT"):
            doi_entity = project_tree.nodes[node]
            null_keys = [
                k for k in doi_entity["value"].keys() if not doi_entity["value"][k]
            ]
            for null_key in null_keys:
                del doi_entity["value"][null_key]
            dois += doi_entity["value"].get("dois", [])
            entities_with_dois.append(project_tree.nodes[node])

        hit_score = "fair"
        if project_id in hits_in_both:
            hit_score = "excellent"
        if project_id in es_only:
            hit_score = "good"

        associated_vectors = [
            res.text for res in vector_results if res.project_id == project_id
        ]

        result_object = CollatedSearchResult(
            project_id=project_id,
            dois=dois,
            project_url=f"https://www.designsafe-ci.org/data/browser/public/designsafe.storage.published/{project_id}",
            associated_text=associated_vectors,
            base_metadata=base_meta,
            publication_metadata=entities_with_dois,
            confidence=hit_score,
        )
        final_result.append(result_object)

    return RetrievalSummary(
        documents=final_result,
        count=es_search_results.hits.total.value,
        full_result_link="https://www.designsafe-ci.org/data/browser/public/designsafe.storage.published",
    )

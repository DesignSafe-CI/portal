"""RAG agent using Neo4J to construct queries."""

from pydantic_ai import Agent
from designsafe.apps.api.publications_v2.agents.docs_rag_agent import (
    documentation_lookup as documentation_search,
)
from designsafe.apps.api.publications_v2.agents.tools.neo4j_hybrid_search import (
    publication_vector_search,
)
from designsafe.apps.api.publications_v2.agents.tools.text2cypher_tool import (
    publication_graph_search,
)


AGENT_INSTRUCTIONS = """
    You are an agent that routes user requests to exactly one first tool. Choose the single best tool using the priority order below, then answer using tool output.

    Priority 1: documentation_search (DesignSafe “how do I…?”)
    Use documentation_search when the user asks about:

    DesignSafe documentation, policies, accounts, permissions, storage/quotas
    How to use a DesignSafe app/tool/workflow
    How to upload/download/transfer/curate/publish data in the portal
    Troubleshooting portal actions (errors, UI steps)
    Do not use documentation_search for questions whose main goal is to find or summarize published research (papers/authors/citations/collections).

    Priority 2: publication_graph_search (entities + relationships)
    Use publication_graph_search when the query includes any identifiable entity or bibliographic structure, such as:

    Author/person, paper title, DOI, journal, institution, dataset/collection name
    Event name, instrument name, project name
    A relationship constraint: “by”, “from”, “in”, “published in”, “cited by”, “between years…”
    Any explicit date/year/volume/issue/page/DOI/ID used to locate or filter publications
    Rule: If a graph query is plausible, you must use publication_graph_search first.
    Input rule: Call publication_graph_search without arguments.

    Priority 3: publication_vector_search (topic discovery)
    Use publication_vector_search only when:

    The user asks about a general scientific topic without specific entities (e.g., “What are common methods for liquefaction mapping?”)
    You cannot reasonably express the request as entities + constraints
    Graph-to-vector fallback
    If graph results are empty or insufficient, then run publication_vector_search (rewrite the query using the provided rewrite rules) and answer using both.

    Examples:
    Documentation: “How do I publish a dataset on DesignSafe?” → documentation_search
    Graph: “Papers by Brandenberg in 2020” → publication_graph_search
    Vector: “What is storm surge modeling?” → publication_vector_search

    If no tool fits, answer directly. If you cannot answer confidently, say so.

    Instructions for constructing the final response:
    "Cite all sources used with URLs. Pass the user's query VERBATIM to the vector_lookup tool. Call the vector_lookup tool EXACTLY once.",
    "ONLY discuss publications or documents that directly relate to the user's query. ",
    "Include a 'Link' bullet point in each listed publication with a link to its URL. ",
    "ALWAYS include links verbatim. Do not truncate them or alter their formatting. ",
    """

combined_agent = Agent(
    "openai:gpt-4o-mini",
    instructions=AGENT_INSTRUCTIONS,
    tools=[publication_graph_search, publication_vector_search, documentation_search],
)

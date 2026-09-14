"""
Tool for hybrid vector/full-text search within Neo4j
"""

import neo4j
import openai
from django.conf import settings

openai_client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)

openai_client_async = openai.AsyncOpenAI(api_key=settings.OPENAI_API_KEY)


NEO4J_URI = settings.NEO4J_URL
neo4j_client = neo4j.GraphDatabase.driver(
    NEO4J_URI, auth=("neo4j", settings.NEO4J_PASS)
)


NODE_VECTOR_INDEX_QUERY = (
    "CALL db.index.vector.queryNodes"
    "($vector_index_name, $top_k * $effective_search_ratio, $query_vector) "
    "YIELD node, score "
    "WITH node, score LIMIT $top_k"
)

FULL_TEXT_SEARCH_QUERY = (
    "CALL db.index.fulltext.queryNodes($fulltext_index_name, $query_text, {limit: $top_k}) "
    "YIELD node, score"
)

QUERY_BODY = (
    "CALL () { "
    f"{NODE_VECTOR_INDEX_QUERY} "
    "WITH collect({node:node, score:score}) AS nodes, max(score) AS vector_index_max_score "
    "UNWIND nodes AS n "
    "RETURN n.node AS node, (n.score / vector_index_max_score) AS score "
    "UNION "
    f"{FULL_TEXT_SEARCH_QUERY} "
    "WITH collect({node:node, score:score}) AS nodes, max(score) AS ft_index_max_score "
    "UNWIND nodes AS n "
    "RETURN n.node AS node, (n.score / ft_index_max_score) AS score } "
    "WITH node, max(score) AS score ORDER BY score DESC LIMIT $top_k "
    "MATCH (c:Collection)-[:HAS_SUMMARY]->(node) "
    "OPTIONAL MATCH (c)-[:HAS_CHILD]->(prj: Collection {type: 'designsafe.project'})"
    "RETURN c, prj, "
    "node { .*, `embedding`: null } AS node, "
    "labels(node) AS nodeLabels, "
    "elementId(node) AS elementId, "
    "elementId(node) AS id, "
    "score"
)


async def publication_vector_search(query: str):
    """
    Tool for performing hybrid full-text/semantic search in cases where the user input
    cannot be expressed as a graph query or invovles a broad conceptual question.
    """
    neo4j_client_async = neo4j.AsyncGraphDatabase.driver(
        NEO4J_URI, auth=("neo4j", settings.NEO4J_PASS)
    )
    _embedding = await openai_client_async.embeddings.create(
        model="text-embedding-ada-002", input=[query]
    )
    query_embedding = _embedding.data[0].embedding
    hybrid_records, _, _ = await neo4j_client_async.execute_query(
        QUERY_BODY,
        fulltext_index_name="summaryFulltext",
        query_text=query,
        top_k=5,
        query_vector=query_embedding,
        vector_index_name="summaryEmbeddings",
        effective_search_ratio=1,
    )

    return str(hybrid_records)

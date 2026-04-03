"""Agentic tools for performing Elasticsearch queries/aggregations."""

from pydantic import BaseModel
from elasticsearch_dsl import Q

from designsafe.apps.api.publications_v2.elasticsearch import IndexedPublication


class SearchHits(BaseModel):
    """Model for search hits returned from Elasticsearch, used for counting/aggregations."""

    hits: list[dict]
    count: int


def perform_es_search(search_terms: list[str]) -> SearchHits:
    """
    Using a set of search terms, returns the search results from performing a full-text
    search using Elasticsearch, and counts the number of hits. This tool should be called
    when the user asks a question that requires a comprehensive search result.
    """

    search_string = " AND ".join(search_terms)

    qs_query = Q(
        "query_string",
        # Elasticsearch can't parse query strings with unescaped slashes
        query=search_string.replace("/", "\\/"),
        default_operator="AND",
        type="cross_fields",
    )

    res = IndexedPublication.search().filter(qs_query).execute()
    hits = [{"nodes": hit.to_dict()["nodes"][::5]} for hit in res.hits]

    return SearchHits(count=res.hits.total.value, hits=hits)

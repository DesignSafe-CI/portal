"""Utility functions for AI keyword extraction and ChromaDB ingest."""

import json
from django.conf import settings
from designsafe.apps.api.publications_v2.models import Publication
from designsafe.apps.api.ai_keywords.views import RAG


def _retrieve_keywords(pub: Publication) -> list[str]:
    """Retrieve and process keywords from a publication."""

    keywords = pub.value.get("keywords", [])

    # Split keywords by comma, semicolon, and hyphens surrounded by spaces
    keywords_split_comma = [keyword.split(",") for keyword in keywords]
    keywords = [
        keyword.strip() for sublist in keywords_split_comma for keyword in sublist
    ]

    keywords_split_semi = [keyword.split(";") for keyword in keywords]
    keywords = [
        keyword.strip() for sublist in keywords_split_semi for keyword in sublist
    ]

    keywords_split_hyphen = [keyword.split(" - ") for keyword in keywords]
    keywords = [
        keyword.strip() for sublist in keywords_split_hyphen for keyword in sublist
    ]

    # Remove duplicates
    return list(set(keywords))


def add_publications_to_chroma(publications: list[Publication]) -> None:
    """Add publications to Chroma vector store."""

    chroma_client = RAG().client

    collection = chroma_client.get_collection(name=settings.CHROMA_COLLECTION)
    docs = []
    ids = []
    metadatas = []

    for pub in publications:
        keywords = _retrieve_keywords(pub)

        # Convert nhTypes to a string
        nh_types = pub.value.get("nhTypes", [])

        doc = {
            "id": f"{pub.project_id}",
            "metadata": {
                "projectId": pub.project_id,
                "title": pub.value.get("title"),
                "description": pub.value.get("description"),
                "keywords": ", ".join(keywords),
                "nhTypes": ", ".join(nhType["id"] for nhType in nh_types),
                "projectType": pub.value.get("projectType"),
            },
        }
        docs.append(json.dumps(doc["metadata"]))
        ids.append(doc["id"])
        metadatas.append(doc["metadata"])

    collection.upsert(documents=docs, ids=ids, metadatas=metadatas)

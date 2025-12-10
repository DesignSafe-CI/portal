"""
Re-ingest keyword vectors into Chroma using OpenAI embeddings (1536 dims).

Usage:
  OPENAI_API_KEY=... OPENAI_API_URL=... \
  CHROMA_ENDPOINT=... CHROMA_PORT=443 CHROMA_USERNAME=... CHROMA_PASSWORD=... \
  CHROMA_COLLECTION=designsafe_keywords_openai \
  python manage.py shell -c "import designsafe.apps.api.ai_keywords.scripts.reindex_keywords_openai as s; s.run()"
"""

import asyncio
import json
import os
from typing import Iterable

import chromadb
from chromadb.config import Settings as ChromaSettings
from django.conf import settings
from django import setup as django_setup
from langchain_openai import OpenAIEmbeddings

# Ensure Django is ready so Publication model can be imported.
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "designsafe.settings")
django_setup()
from designsafe.apps.api.publications_v2.models import Publication  # noqa: E402


def chunked(iterable: Iterable, size: int):
    """Yield items from iterable in chunks of given size."""
    chunk = []
    for item in iterable:
        chunk.append(item)
        if len(chunk) >= size:
            yield chunk
            chunk = []
    if chunk:
        yield chunk


async def ingest(collection, embedder: OpenAIEmbeddings, publications):
    """Ingest keywords for the provided publications into the Chroma collection."""
    for pub_batch in chunked(publications, 50):
        docs = []
        metadatas = []
        ids = []

        for pub in pub_batch:
            keywords = pub.value.get("keywords", [])

            # Split keywords by comma, semicolon, and spaced hyphens.
            parts = []
            for kw in keywords:
                parts.extend(kw.split(","))
            keywords = [kw.strip() for kw in parts if kw.strip()]

            parts = []
            for kw in keywords:
                parts.extend(kw.split(";"))
            keywords = [kw.strip() for kw in parts if kw.strip()]

            parts = []
            for kw in keywords:
                parts.extend(kw.split(" - "))
            keywords = [kw.strip() for kw in parts if kw.strip()]

            keywords = list(set(keywords))  # de-duplicate

            nh_types = pub.value.get("nhTypes", [])
            stringified_nh_types = ",".join(json.dumps(nh) for nh in nh_types)

            for keyword in keywords:
                doc_id = f"{pub.project_id}-{keyword.replace(' ', '_')}"
                ids.append(doc_id)
                metadatas.append(
                    {
                        "projectId": pub.project_id,
                        "title": pub.value.get("title"),
                        "description": pub.value.get("description"),
                        "keyword": keyword,
                        "keywords": ", ".join(keywords),
                        "nhTypes": stringified_nh_types,
                        "projectType": pub.value.get("projectType"),
                    }
                )
                docs.append(
                    f"project_id: {pub.project_id}\n"
                    f"title: {pub.value.get('title')}\n"
                    f"description: {pub.value.get('description')}\n"
                    f"keyword: {keyword}\n"
                    f"keywords: {', '.join(keywords)}\n"
                    f"nhTypes: {stringified_nh_types}\n"
                    f"projectType: {pub.value.get('projectType')}"
                )

        # Compute embeddings (runs sync; wrap in thread to avoid blocking event loop).
        embeddings = await asyncio.to_thread(embedder.embed_documents, docs)
        await collection.add(
            documents=docs, metadatas=metadatas, embeddings=embeddings, ids=ids
        )
        print(f"Added {len(ids)} records to collection")


async def main():
    chroma_endpoint = settings.CHROMA_ENDPOINT
    chroma_port = settings.CHROMA_PORT
    chroma_username = settings.CHROMA_USERNAME
    chroma_password = settings.CHROMA_PASSWORD
    collection_name = settings.CHROMA_COLLECTION

    embedder = OpenAIEmbeddings(
        model="text-embedding-3-small",
        api_key=settings.OPENAI_API_KEY,
        base_url=settings.OPENAI_API_URL,
    )

    chroma_client = await chromadb.AsyncHttpClient(
        host=chroma_endpoint,
        port=chroma_port,
        ssl=True,
        settings=ChromaSettings(
            chroma_client_auth_provider="chromadb.auth.basic_authn.BasicAuthClientProvider",
            chroma_client_auth_credentials=f"{chroma_username}:{chroma_password}",
            chroma_auth_token_transport_header="Authorization",
        ),
    )

    # Optionally delete existing collection if RECREATE_COLLECTION=1
    if os.environ.get("RECREATE_COLLECTION") == "1":
        try:
            await chroma_client.delete_collection(name=collection_name)
            print(f"Deleted existing collection '{collection_name}'")
        except Exception:
            pass

    collection = await chroma_client.get_or_create_collection(name=collection_name)

    # Stream publications (Django ORM is sync; iterate synchronously here)
    publications = Publication.objects.all().iterator()
    await ingest(collection, embedder, publications)
    print("Re-ingest complete.")


def run():
    """Entry point for manage.py shell -c usage."""
    asyncio.run(main())


if __name__ == "__main__":
    run()

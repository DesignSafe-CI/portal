"""
Util for populating the ChromaDB database.
"""

import os
import uuid
import chromadb
from chromadb.config import Settings as ChromaSettings
from chromadb.api import ClientAPI
from chromadb.utils import embedding_functions
from designsafe.apps.api.publications_v2.agents.process_mkdocs import (
    process_markdown_files,
    Document,
)
from designsafe.apps.api.publications_v2.agents.process_url import (
    WebScraper,
    DOC_SOURCES,
)

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
OPENAI_EMBEDDING_MODEL = os.environ.get(
    "OPENAI_EMBEDDING_MODEL", "text-embedding-ada-002"
)

CHROMA_COLLECTION_NAME = "designsafe_docs"


openai_ef = embedding_functions.OpenAIEmbeddingFunction(
    api_key=OPENAI_API_KEY, model_name=OPENAI_EMBEDDING_MODEL
)


def ingest_documents(chroma_client: ClientAPI, docs: list[Document]):
    """
    Ingest a set of documents into ChromaDB

    :param chroma_client: ChromaDB client object.
    :type chroma_client: ClientAPI
    :param docs: List of document objects to ingest.
    :type docs: list[Document]
    """
    collection = chroma_client.get_or_create_collection(
        CHROMA_COLLECTION_NAME, embedding_function=openai_ef
    )
    chunk_size = 1
    docs_slice = slice(0, chunk_size)
    while docs_chunk := docs[docs_slice]:
        documents = [d.text for d in docs_chunk]
        metadata = [d.metadata for d in docs_chunk]

        ids = [str(uuid.uuid4()) for d in documents]
        try:
            collection.add(documents=documents, metadatas=metadata, ids=ids)
        # pylint:disable=broad-exception-caught
        except Exception:
            print(f"EXCEPTION: {documents}")

        print(f"indexed embeddings for slice {docs_slice.start}-{docs_slice.stop}")

        docs_slice = slice(docs_slice.stop, docs_slice.stop + chunk_size)


def setup_chromadb():
    """
    Method to ingest documentation into ChromaDB.
    """
    chroma_client = chromadb.HttpClient(
        host="chromadb",
        port=8000,
        settings=ChromaSettings(anonymized_telemetry=False),
    )

    docs = process_markdown_files()
    ingest_documents(chroma_client, docs)

    scraper = WebScraper()
    for web_source_key in DOC_SOURCES:
        docs = scraper.scrape_site(web_source_key)
        ingest_documents(chroma_client, docs)

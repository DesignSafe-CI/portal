"""
Util for populating the ChromaDB database.
"""

import os
import uuid
import chromadb
from chromadb.config import Settings as ChromaSettings
from chromadb.utils import embedding_functions
from designsafe.apps.api.publications_v2.agents.process_mkdocs import (
    process_markdown_files,
)

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
OPENAI_EMBEDDING_MODEL = os.environ.get(
    "OPENAI_EMBEDDING_MODEL", "text-embedding-ada-002"
)

CHROMA_COLLECTION_NAME = "designsafe_docs"


openai_ef = embedding_functions.OpenAIEmbeddingFunction(
    api_key=OPENAI_API_KEY, model_name=OPENAI_EMBEDDING_MODEL
)


def setup_chromadb():
    """
    Method to ingest documentation into ChromaDB.
    """
    chroma_client = chromadb.HttpClient(
        host="chromadb",
        port=8000,
        settings=ChromaSettings(anonymized_telemetry=False),
    )
    collection = chroma_client.get_or_create_collection(
        CHROMA_COLLECTION_NAME, embedding_function=openai_ef
    )
    docs = process_markdown_files()
    # def embed_documents(chunk_size=100):
    chunk_size = 100
    docs_slice = slice(0, chunk_size)
    while docs_chunk := docs[docs_slice]:
        documents = [d.text for d in docs_chunk]
        metadata = [d.metadata for d in docs_chunk]

        ids = [str(uuid.uuid4()) for d in documents]
        collection.add(documents=documents, metadatas=metadata, ids=ids)

        print(f"indexed embeddings for slice {docs_slice.start}-{docs_slice.stop}")

        docs_slice = slice(docs_slice.stop, docs_slice.stop + chunk_size)

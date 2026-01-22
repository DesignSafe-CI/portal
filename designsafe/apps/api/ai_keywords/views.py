"""Views for RAG-based keyword suggestions."""

import json
import logging
from chromadb import HttpClient, Settings
from typing_extensions import List, TypedDict
from langchain_core.documents import Document
from langgraph.graph import START, StateGraph
from langchain_chroma import Chroma
from langchain.prompts import PromptTemplate
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from django.http import HttpRequest, JsonResponse
from django.conf import settings
from designsafe.apps.api.views import BaseApiView, ApiException

logger = logging.getLogger(__name__)


SCORE_THRESHOLD = 0.25


class KeywordsView(BaseApiView):
    """View to get keyword suggestions based on project title and description."""

    def get(self, request: HttpRequest):
        """Get keyword suggestions based on project title and description."""

        title = request.GET.get("title")
        description = request.GET.get("description")

        if not title or not description:
            raise ApiException("title or description not in request")

        try:
            rag = RAG()
        except Exception as e:
            raise ApiException("Error initializing RAG") from e

        graph_builder = StateGraph(State).add_sequence([rag.retrieve, rag.generate])
        graph_builder.add_edge(START, "retrieve")
        graph = graph_builder.compile()
        resp = graph.invoke(
            {"question": f"project title: {title}, description: {description}"}
        )
        try:
            resp_list = _parse_keywords_response(resp["answer"])
        except (AttributeError, TypeError, ValueError):
            logger.exception("Error decoding answer")
            logger.debug(f"Raw answer: {resp['answer']}")
            resp_list = []

        return JsonResponse({"response": resp_list})


class State(TypedDict):
    """RAG state model"""

    question: str
    context: List[Document]
    answer: str


class RAG:
    """Retrieval-Augmented Generation for keyword suggestions."""

    API_KEY = settings.OPENAI_API_KEY
    API_ENDPOINT = settings.OPENAI_API_URL

    template = """
    You are an assistant for finding keywords for a supplied project title and description. Use the following pieces of retrieved context to answer the question. If you don't know the answer, respond with nothing.
    Reference the "keywords" field in the metadata object of the retrieved responses for existing keyword examples.
    Respond only with the suggested keywords as a comma-separated list of strings, ordered by rank. Respond only with your final answer, and do not include any other text or commentary.
    Make sure to follow these guidelines for keyword suggestions:

    Best Practices for Keywords
    - Keywords may be single words or multi-word phrases (e.g. "storm surge", "tropical storm", "machine learning"). Match the format of suggested keywords to that of the existing keyword examples.
    - Think like a user: choose terms someone would actually type (hazard type, method, region).
    - Include technology or problem addressed, and the purpose of the data.
    - Repeat important words from your title/description to boost discoverability.
    - Rank by frequency among other existing projects, by similarity or synonym to the words in the project title and project description; proper nouns carry less weight.
    - Do not include proper nouns (e.g. specific names of people, places, or events) unless directly referenced in the provided title or description.

    Question: {question}
    Context: {context}
    Answer:
    """

    QA_CHAIN_PROMPT = PromptTemplate.from_template(template)

    def __init__(self):
        try:
            self.client = HttpClient(
                host=settings.CHROMA_ENDPOINT,
                port=settings.CHROMA_PORT,
                ssl=True,
                settings=Settings(
                    chroma_client_auth_provider="chromadb.auth.basic_authn.BasicAuthClientProvider",
                    chroma_client_auth_credentials=f"{settings.CHROMA_USERNAME}:{settings.CHROMA_PASSWORD}",
                    chroma_auth_token_transport_header="Authorization",
                ),
            )

            embedding_function = OpenAIEmbeddings(
                model="text-embedding-3-small",
                api_key=self.API_KEY,
                base_url=self.API_ENDPOINT,
                dimensions=384,
            )

            self.vector_store = Chroma(
                client=self.client,
                collection_name=settings.CHROMA_COLLECTION,
                embedding_function=embedding_function,
            )

            self.llm = ChatOpenAI(
                base_url=self.API_ENDPOINT,
                api_key=self.API_KEY,
                model="gpt-4o-mini",
                temperature=0.1,
                top_p=0.1,
            )

        except Exception as e:
            logger.exception("Error initializing RAG")
            raise e

    def retrieve(self, state: State):
        """Retrieve relevant documents from vector store based on the question."""
        retrieved_docs = self.vector_store.similarity_search_with_relevance_scores(
            state["question"], k=10, score_threshold=SCORE_THRESHOLD
        )
        return {"context": [doc[0].page_content for doc in retrieved_docs]}

    def generate(self, state: State):
        """Generate an answer based on the question and retrieved documents."""
        docs_content = "\n\n".join(doc for doc in state["context"])
        messages = self.QA_CHAIN_PROMPT.invoke(
            {"question": state["question"], "context": docs_content}
        )
        response = self.llm.invoke(messages)
        return {"answer": response.content}


def _parse_keywords_response(answer: str) -> list[str]:
    """Normalize the LLM response into a list of keyword strings."""
    
    if not isinstance(answer, str):
        return []
    normalized = answer.strip()
    if not normalized:
        return []

    if normalized.startswith("[") and normalized.endswith("]"):
        try:
            parsed = json.loads(normalized)
            if isinstance(parsed, list):
                return [_clean_keyword(kw) for kw in parsed if _clean_keyword(kw)]
        except json.JSONDecodeError:
            pass

    parts = [part.strip() for part in normalized.split(",")]
    return [_clean_keyword(part) for part in parts if _clean_keyword(part)]


def _clean_keyword(value: str) -> str:
    """Strip wrapping quotes/brackets from a keyword."""
    if not isinstance(value, str):
        return ""
    cleaned = value.strip().strip("[](){}")
    
    # Checks that the string has at least 2 characters and is wrapped in matching single or double quotes. If so, removes the outer quotes.
    if (
        len(cleaned) >= 2
        and cleaned[0] == cleaned[-1]
        and cleaned[0] in ("'", '"')
    ):
        cleaned = cleaned[1:-1].strip()
    return cleaned

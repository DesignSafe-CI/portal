"""Views for RAG-based keyword suggestions."""

import logging
from chromadb import HttpClient, Settings
from typing_extensions import List, TypedDict
from langchain_core.documents import Document
from langgraph.graph import START, StateGraph
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain.prompts import PromptTemplate
from langchain_openai import ChatOpenAI
from django.http import HttpRequest, JsonResponse
from django.conf import settings
from designsafe.apps.api.views import BaseApiView, ApiException

logger = logging.getLogger(__name__)


SCORE_THRESHOLD = 0.25


class KeywordsView(BaseApiView):
    """View to get keyword suggestions based on project title and description."""

    def get(self, request: HttpRequest):
        """Get keyword suggestions based on project title, description, and hazard types."""

        title = request.GET.get("title")
        description = request.GET.get("description")
        hazard_types = request.GET.get("hazard_types")

        if not title or not description or not hazard_types:
            raise ApiException("title, description, or hazard types not in request")

        try:
            rag = RAG()
        except Exception as e:
            raise ApiException("Error initializing RAG") from e

        graph_builder = StateGraph(State).add_sequence([rag.retrieve, rag.generate])
        graph_builder.add_edge(START, "retrieve")
        graph = graph_builder.compile()
        resp = graph.invoke(
            {"question": f"project title: {title}, description: {description}, hazard types: {hazard_types}"}
        )
        try:
            answer = resp["answer"].split(", ")
        except AttributeError:
            logger.exception("Error decoding answer")
            logger.debug(f"Raw answer: {resp['answer']}")
            answer = []

        resp_list = answer if isinstance(answer, list) else []

        return JsonResponse({"response": resp_list})


class State(TypedDict):
    """RAG state model"""

    question: str
    context: List[Document]
    answer: str


class RAG:
    """Retrieval-Augmented Generation for keyword suggestions."""

    API_KEY = settings.SN_API_KEY
    API_ENDPOINT = settings.SN_API_ENDPOINT

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
    - Rank by frequency among other existing projects, by similarity or synonym to the words in the project title, project description, and "nhTypes" field in the metadata object of the retrieved context; proper nouns carry less weight.
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

            embedding_function = HuggingFaceEmbeddings(
                model_name="sentence-transformers/all-MiniLM-L6-v2"
            )

            self.vector_store = Chroma(
                client=self.client,
                collection_name=settings.CHROMA_COLLECTION,
                embedding_function=embedding_function,
            )

            self.llm = ChatOpenAI(
                base_url=self.API_ENDPOINT,
                api_key=self.API_KEY,
                model="Llama-4-Maverick-17B-128E-Instruct",
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

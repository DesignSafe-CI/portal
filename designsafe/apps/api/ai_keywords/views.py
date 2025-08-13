from designsafe.apps.api.views import BaseApiView, ApiException
from django.http import HttpRequest, JsonResponse
import logging
import chromadb
import json
from typing_extensions import List, TypedDict
from langchain_core.documents import Document
from langgraph.graph import START, StateGraph
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain.prompts import PromptTemplate
from langchain_openai import ChatOpenAI
from django.conf import settings


logger = logging.Logger(__name__)


class KeywordsView(BaseApiView):

    def get(self, request: HttpRequest):
        # Compile application and test# Compile application and test
        title = request.GET.get("title")
        description = request.GET.get("description")

        if not title or not description:
            raise ApiException("title or description not in request")
        rag = Rag()
        graph_builder = StateGraph(State).add_sequence([rag.retrieve, rag.generate])
        graph_builder.add_edge(START, "retrieve")
        graph = graph_builder.compile()
        resp = graph.invoke(
            {"question": f"project title: {title}, description: {description}"}
        )
        logger.debug(resp)
        try:
            answer = json.loads(resp["answer"])
        except Exception:
            logger.exception("Error decoding answer")
            answer = []

        resp_list = answer if type(answer) is list else []

        return JsonResponse({"response": resp_list})


class State(TypedDict):
    question: str
    context: List[Document]
    answer: str


class Rag:

    API_KEY = settings.SN_API_KEY
    API_ENDPOINT = settings.SN_API_ENDPOINT

    chroma_client = chromadb.HttpClient(
        host=settings.CHROMA_ENDPOINT, port=443
    )

    embedding_function = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )

    vector_store = Chroma(
        client=chroma_client,
        collection_name="keywords_testing",
        embedding_function=embedding_function,
    )

    llm = ChatOpenAI(
        base_url=API_ENDPOINT,
        api_key=API_KEY,
        model="Llama-4-Maverick-17B-128E-Instruct",
        temperature=0.1,
        top_p=0.1,
    )

    template = """
    You are an assistant for finding keywords for a supplied project title and description. Use the following pieces of retrieved context to answer the question. If you don't know the answer, respond with nothing.
    Reference the 'keyword' field in the metadata object of the retrieved responses for existing keyword examples.
    Respond only with the suggested keywords as a Python array of comma-separated strings, ordered by rank.

    Best Practices for Keywords
    • Keywords may be single words or multi-word phrases (e.g. “storm surge”, “tropical storm”, “machine learning”). Match the format of suggested keywords to that of the existing keyword examples.
    • Think like a user: choose terms someone would actually type (hazard type, method, region…).
    • Include technology or problem addressed, and the purpose of the data.
    • Repeat important words from your title/description to boost discoverability.
    • Rank by frequency among other existing projects, by similarity or synonym to the words in the project title and project description; proper nouns carry less weight.

    Question: {question}
    Context: {context}
    Answer:
    """

    QA_CHAIN_PROMPT = PromptTemplate.from_template(template)

    # Define application steps
    def retrieve(self, state: State):
        retrieved_docs = self.vector_store.similarity_search(state["question"])
        return {"context": retrieved_docs}

    def generate(self, state: State):
        docs_content = "\n\n".join(doc.page_content for doc in state["context"])
        messages = self.QA_CHAIN_PROMPT.invoke(
            {"question": state["question"], "context": docs_content}
        )
        response = self.llm.invoke(messages)
        return {"answer": response.content}

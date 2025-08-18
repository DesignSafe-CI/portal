"""
DesignSafe User Guide RAG System
Creates a searchable vector database from the DesignSafe documentation
"""

# import os
import re
from pathlib import Path
from typing import List, Dict, Optional
from urllib.parse import urljoin
import yaml
import logging
from dotenv import load_dotenv
from django.conf import settings
from asgiref.sync import sync_to_async

# LlamaIndex imports
from llama_index.core import Document, VectorStoreIndex, StorageContext

# from llama_index.core.node_parser import SimpleNodeParser
from llama_index.embeddings.openai import OpenAIEmbedding
from llama_index.vector_stores.chroma import ChromaVectorStore
from llama_index.core.settings import Settings

# ChromaDB imports
import chromadb
from chromadb.config import Settings as ChromaSettings

# Web scraping imports (optional)
import requests
from bs4 import BeautifulSoup

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()


class DesignSafeRAG:
    def __init__(
        self,
        base_url: str = "https://www.designsafe-ci.org/user-guide/",
        chroma_path: str = "/srv/www/designsafe/chroma_db/chroma",
        collection_name: str = "designsafe_docs",
    ):
        """
        Initialize the DesignSafe RAG system.

        Args:
            base_url: Base URL for the DesignSafe documentation
            chroma_path: Path to store ChromaDB database
            collection_name: Name of the ChromaDB collection
        """
        self.base_url = base_url
        self.chroma_path = chroma_path
        self.collection_name = collection_name

        # Initialize OpenAI embedding model
        api_key = settings.OPENAI_API_KEY
        if not api_key:
            raise ValueError("OPENAI_API_KEY not found in environment variables")

        self.embed_model = OpenAIEmbedding(
            model="text-embedding-ada-002", api_key=api_key
        )

        # Set global settings for LlamaIndex
        Settings.embed_model = self.embed_model

        # Initialize ChromaDB
        self.chroma_client = chromadb.PersistentClient(
            path=chroma_path, settings=ChromaSettings(anonymized_telemetry=False)
        )

        # Create or get collection
        try:
            self.collection = self.chroma_client.create_collection(
                name=collection_name, metadata={"hnsw:space": "cosine"}
            )
            logger.info(f"Created new collection: {collection_name}")
        except Exception:
            self.collection = self.chroma_client.get_collection(name=collection_name)
            logger.info(f"Using existing collection: {collection_name}")

        # Initialize vector store
        self.vector_store = ChromaVectorStore(chroma_collection=self.collection)

    def parse_mkdocs_config(self, config_path: str) -> Dict:
        """Parse MkDocs configuration to understand the site structure."""
        with open(config_path, "r") as f:
            config = yaml.safe_load(f)
        return config

    def extract_nav_structure(self, nav: List, parent_path: str = "") -> List[Dict]:
        """Extract navigation structure from MkDocs nav configuration."""
        pages = []

        for item in nav:
            if isinstance(item, dict):
                for title, content in item.items():
                    if isinstance(content, str):
                        # This is a direct page link
                        if content.startswith("http"):
                            # External link
                            pages.append(
                                {
                                    "title": title,
                                    "file": None,
                                    "url": content,
                                    "section": parent_path,
                                }
                            )
                        else:
                            # Internal markdown file
                            pages.append(
                                {
                                    "title": title,
                                    "file": content,
                                    "url": self.build_url(content),
                                    "section": parent_path,
                                }
                            )
                    elif isinstance(content, list):
                        # This is a section with sub-pages
                        new_parent = f"{parent_path}/{title}" if parent_path else title
                        pages.extend(self.extract_nav_structure(content, new_parent))

        return pages

    def build_url(self, md_file: str) -> str:
        """Build the full URL from a markdown file path."""
        # Remove .md extension and handle special cases
        if md_file == "index.md":
            return self.base_url

        url_path = md_file.replace(".md", "/").replace("index/", "")
        return urljoin(self.base_url, url_path)

    def extract_sections_from_markdown(
        self, content: str, file_info: Dict
    ) -> List[Document]:
        """Extract sections from markdown content with proper metadata."""
        documents = []

        # Split content by headers
        header_pattern = r"^(#{1,6})\s+(.+)$"
        lines = content.split("\n")

        current_section = file_info["title"]
        current_content = []
        current_level = 0
        section_stack = [file_info["title"]]

        for line in lines:
            header_match = re.match(header_pattern, line)

            if header_match:
                # Save previous section if it has content
                if current_content:
                    content_text = "\n".join(current_content).strip()
                    if content_text:
                        # Build the URL with anchor
                        anchor = self.create_anchor(current_section.split(" / ")[-1])
                        section_url = (
                            f"{file_info['url']}#{anchor}"
                            if anchor
                            else file_info["url"]
                        )

                        doc = Document(
                            text=content_text,
                            metadata={
                                "title": file_info["title"],
                                "file": file_info["file"],
                                "section": " / ".join(section_stack),
                                "url": section_url,
                                "base_url": file_info["url"],
                                "anchor": anchor,
                            },
                        )
                        documents.append(doc)

                # Start new section
                level = len(header_match.group(1))
                section_title = header_match.group(2).strip()

                # Update section stack based on header level
                if level <= current_level:
                    # Pop items from stack until we reach the right level
                    while len(section_stack) > level:
                        section_stack.pop()

                if len(section_stack) < level:
                    # Ensure we don't skip levels
                    while len(section_stack) < level - 1:
                        section_stack.append("")
                    section_stack.append(section_title)
                else:
                    section_stack[level - 1] = section_title

                current_section = section_title
                current_level = level
                current_content = []
            else:
                current_content.append(line)

        # Don't forget the last section
        if current_content:
            content_text = "\n".join(current_content).strip()
            if content_text:
                anchor = self.create_anchor(current_section)
                section_url = (
                    f"{file_info['url']}#{anchor}"
                    if anchor and anchor != file_info["title"].lower().replace(" ", "-")
                    else file_info["url"]
                )

                doc = Document(
                    text=content_text,
                    metadata={
                        "title": file_info["title"],
                        "file": file_info["file"],
                        "section": " / ".join(section_stack),
                        "url": section_url,
                        "base_url": file_info["url"],
                        "anchor": anchor,
                    },
                )
                documents.append(doc)

        return documents

    def create_anchor(self, text: str) -> str:
        """Create an anchor link from section title (following common markdown conventions)."""
        # Convert to lowercase and replace spaces with hyphens
        anchor = text.lower()
        # Remove special characters except hyphens and underscores
        anchor = re.sub(r"[^\w\s-]", "", anchor)
        # Replace spaces with hyphens
        anchor = re.sub(r"\s+", "-", anchor)
        # Remove duplicate hyphens
        anchor = re.sub(r"-+", "-", anchor)
        # Strip leading/trailing hyphens
        anchor = anchor.strip("-")
        return anchor

    def process_markdown_files(self, docs_dir: str = "user-guide/docs"):
        """Process all markdown files from the documentation directory."""
        docs_path = Path(docs_dir)

        # Parse MkDocs config
        config_path = Path("user-guide/mkdocs.yml")
        config = self.parse_mkdocs_config(str(config_path))

        # Extract navigation structure
        nav_pages = self.extract_nav_structure(config.get("nav", []))

        all_documents = []

        for page_info in nav_pages:
            if page_info["file"] and not page_info["file"].startswith("http"):
                file_path = docs_path / page_info["file"]

                if file_path.exists():
                    logger.info(f"Processing: {page_info['file']}")

                    with open(file_path, "r", encoding="utf-8") as f:
                        content = f.read()

                    # Extract sections from the markdown file
                    documents = self.extract_sections_from_markdown(content, page_info)
                    all_documents.extend(documents)

                    logger.info(
                        f"  Extracted {len(documents)} sections from {page_info['file']}"
                    )
                else:
                    logger.warning(f"File not found: {file_path}")

        logger.info(f"Total documents extracted: {len(all_documents)}")
        return all_documents

    def scrape_website(self, start_url: Optional[str] = None) -> List[Document]:
        """
        Alternative method: Scrape the website directly.
        This can capture the rendered HTML which might include additional content.
        """
        documents = []
        visited_urls = set()
        to_visit = [start_url or self.base_url]

        while to_visit:
            url = to_visit.pop(0)

            if url in visited_urls:
                continue

            # Only process URLs within the base domain
            if not url.startswith(self.base_url):
                continue

            visited_urls.add(url)
            logger.info(f"Scraping: {url}")

            try:
                response = requests.get(url, timeout=10)
                response.raise_for_status()

                soup = BeautifulSoup(response.content, "html.parser")

                # Extract main content (adjust selectors based on actual site structure)
                main_content = (
                    soup.find("div", class_="rst-content")
                    or soup.find("main")
                    or soup.find("article")
                )

                if main_content:
                    # Extract title
                    title = soup.find("h1")
                    title_text = title.get_text(strip=True) if title else "Untitled"

                    # Extract sections
                    for section in main_content.find_all(["section", "div"]):
                        section_title = section.find(["h1", "h2", "h3", "h4"])
                        if section_title:
                            section_id = section_title.get("id", "")
                            section_url = f"{url}#{section_id}" if section_id else url

                            # Get section text
                            section_text = section.get_text(separator="\n", strip=True)

                            if section_text:
                                doc = Document(
                                    text=section_text,
                                    metadata={
                                        "title": title_text,
                                        "section": section_title.get_text(strip=True),
                                        "url": section_url,
                                        "base_url": url,
                                        "anchor": section_id,
                                    },
                                )
                                documents.append(doc)

                    # Find more links to crawl
                    for link in main_content.find_all("a", href=True):
                        href = link["href"]
                        if not href.startswith("http"):
                            href = urljoin(url, href)
                        if href.startswith(self.base_url) and href not in visited_urls:
                            to_visit.append(href)

            except Exception as e:
                logger.error(f"Error scraping {url}: {e}")

        logger.info(f"Total pages scraped: {len(visited_urls)}")
        logger.info(f"Total documents extracted: {len(documents)}")
        return documents

    def build_index(self, documents: List[Document]):
        """Build the vector index from documents."""
        logger.info("Building vector index...")

        # Create storage context with ChromaDB
        storage_context = StorageContext.from_defaults(vector_store=self.vector_store)

        # Create index
        index = VectorStoreIndex.from_documents(
            documents, storage_context=storage_context, show_progress=True
        )

        logger.info("Vector index built successfully!")
        return index

    def query(self, query_text: str, top_k: int = 5):
        """Query the vector database."""
        # Load existing index
        index = VectorStoreIndex.from_vector_store(
            self.vector_store, embed_model=self.embed_model
        )

        # Create query engine
        query_engine = index.as_query_engine(similarity_top_k=top_k)

        # Query
        response = query_engine.query(query_text)

        return response


def main():
    """Main function to create and populate the RAG system."""
    # Initialize RAG system
    rag = DesignSafeRAG()

    # Choose processing method
    print("Choose processing method:")
    print("1. Process local markdown files")
    print("2. Scrape website directly")
    choice = input("Enter choice (1 or 2): ").strip()

    if choice == "1":
        # Process markdown files
        documents = rag.process_markdown_files()
    elif choice == "2":
        # Scrape website
        documents = rag.scrape_website()
    else:
        print("Invalid choice. Using markdown processing by default.")
        documents = rag.process_markdown_files()

    if documents:
        # Build index
        index = rag.build_index(documents)
        print(
            f"\nSuccessfully created RAG system with {len(documents)} document chunks!"
        )

        # Test query
        print("\n" + "=" * 50)
        print("Testing the RAG system...")
        test_query = "How do I transfer data to DesignSafe?"
        print(f"Query: {test_query}")
        response = rag.query(test_query)
        print(f"Response: {response}")
    else:
        print("No documents were processed. Please check the configuration.")


# if __name__ == "__main__":
#     main()

def query_docs_rag(payload):
    """Utility function to query the documentation RAG"""
    rag = DesignSafeRAG()
    output = rag.query(payload)
    return output.response

async_query_docs_rag = sync_to_async(query_docs_rag)

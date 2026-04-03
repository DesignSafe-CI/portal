# pylint: skip-file
"""
DesignSafe & SimCenter Documentation RAG System
Scrapes documentation directly from live websites:
- DesignSafe User Guide (https://www.designsafe-ci.org/user-guide/)
- DesignSafe Training (https://www.designsafe-ci.org/user-guide/training/)
- SimCenter Tools (quoFEM, EE-UQ, Hydro, WE-UQ, PBE, R2D)
"""

import time
import logging
from typing import List, Set, Optional
from urllib.parse import urljoin, urlparse

from collections import deque


from pydantic import BaseModel

# Web scraping imports
import requests
from bs4 import BeautifulSoup

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Suppress ChromaDB telemetry errors
logging.getLogger("chromadb.telemetry.product.posthog").setLevel(logging.CRITICAL)

# Load environment variables
# load_dotenv()


class Document(BaseModel):
    """
    Model for representing a chunk of text.
    """

    text: str
    metadata: dict


# Documentation source configurations
DOC_SOURCES = {
    # "designsafe-user-guide": {
    #    "name": "DesignSafe User Guide",
    #    "base_url": "https://www.designsafe-ci.org/user-guide/",
    #    "type": "mkdocs",
    #    "description": "Main DesignSafe documentation for data management, tools, and workflows",
    # },
    "designsafe-training": {
        "name": "DesignSafe Training",
        "base_url": "https://www.designsafe-ci.org/user-guide/training/",
        "type": "mkdocs",
        "description": "Training materials and tutorials for DesignSafe",
    },
    "training-opensees": {
        "name": "OpenSees Training",
        "base_url": "https://DesignSafe-CI.github.io/training-OpenSees-on-DesignSafe/",
        "type": "jupyter-book",
        "description": "OpenSees on DesignSafe training materials",
    },
    "training-database-api": {
        "name": "Database API Training",
        "base_url": "https://DesignSafe-CI.github.io/training-database-api/",
        "type": "jupyter-book",
        "description": "Database API training for DesignSafe",
    },
    "training-accelerating-python": {
        "name": "Accelerating Python Training",
        "base_url": "https://DesignSafe-CI.github.io/training-accelerating-python/",
        "type": "jupyter-book",
        "description": "Accelerating Python training",
    },
    "training-xai": {
        "name": "Explainable AI Training",
        "base_url": "https://DesignSafe-CI.github.io/training-xai/",
        "type": "jupyter-book",
        "description": "Explainable AI training",
    },
    "training-pinn": {
        "name": "Physics-Informed Neural Networks Training",
        "base_url": "https://DesignSafe-CI.github.io/training-pinn/",
        "type": "jupyter-book",
        "description": "Physics-Informed Neural Networks training",
    },
    "training-deeponet": {
        "name": "DeepONet Training",
        "base_url": "https://DesignSafe-CI.github.io/training-deeponet/",
        "type": "jupyter-book",
        "description": "DeepONet training",
    },
    "quofem": {
        "name": "quoFEM",
        "base_url": "https://nheri-simcenter.github.io/quoFEM-Documentation/",
        "type": "sphinx",
        "description": "Quantified Uncertainty with Optimization for the FEM",
    },
    "ee-uq": {
        "name": "EE-UQ",
        "base_url": "https://nheri-simcenter.github.io/EE-UQ-Documentation/",
        "type": "sphinx",
        "description": "Earthquake Engineering with Uncertainty Quantification",
    },
    "hydro-uq": {
        "name": "Hydro-UQ",
        "base_url": "https://nheri-simcenter.github.io/Hydro-Documentation/",
        "type": "sphinx",
        "description": "Water-borne Hazards Engineering with Uncertainty Quantification",
    },
    "we-uq": {
        "name": "WE-UQ",
        "base_url": "https://nheri-simcenter.github.io/WE-UQ-Documentation/",
        "type": "sphinx",
        "description": "Wind Engineering with Uncertainty Quantification",
    },
    "pbe": {
        "name": "PBE",
        "base_url": "https://nheri-simcenter.github.io/PBE-Documentation/",
        "type": "sphinx",
        "description": "Performance-Based Engineering Application",
    },
    "r2d": {
        "name": "R2D",
        "base_url": "https://nheri-simcenter.github.io/R2D-Documentation/",
        "type": "sphinx",
        "description": "Regional Resilience Determination Tool",
    },
}


class WebScraper:
    """Web scraper for documentation sites."""

    def __init__(self, delay: float = 0.3, max_pages: int = 0):
        """
        Initialize the web scraper.

        Args:
            delay: Delay between requests in seconds (be polite to servers)
            max_pages: Maximum number of pages to scrape per source
        """
        self.delay = delay
        self.max_pages = max_pages
        self.session = requests.Session()
        self.session.headers.update(
            {"User-Agent": "DesignSafe-RAG-Bot/1.0 (Educational/Research Purpose)"}
        )

    def fetch_page(self, url: str) -> Optional[BeautifulSoup]:
        """Fetch and parse a single page, following redirects."""
        try:
            response = self.session.get(url, timeout=30, allow_redirects=True)
            response.raise_for_status()

            soup = BeautifulSoup(response.content, "html.parser")

            # Check for meta refresh redirect
            meta_refresh = soup.find("meta", attrs={"http-equiv": "Refresh"})
            if meta_refresh and meta_refresh.get("content"):
                content = meta_refresh.get("content", "")
                if "url=" in content.lower():
                    redirect_url = content.split("url=")[-1].strip()
                    full_redirect = urljoin(url, redirect_url)
                    logger.info(f"    Following redirect to {full_redirect}")
                    return self.fetch_page(full_redirect)

            return soup
        except Exception as e:
            logger.error(f"Error fetching {url}: {e}")
            return None

    def get_links(
        self, soup: BeautifulSoup, base_url: str, current_url: str
    ) -> Set[str]:
        """Extract all internal documentation links from a page."""
        links = set()
        parsed_base = urlparse(base_url)

        for a in soup.find_all("a", href=True):
            href = a["href"]

            # Skip anchors, external links, and special links
            if (
                href.startswith("#")
                or href.startswith("mailto:")
                or href.startswith("javascript:")
            ):
                continue

            # Resolve relative URLs
            full_url = urljoin(current_url, href)
            parsed_url = urlparse(full_url)

            # Remove fragment
            full_url = f"{parsed_url.scheme}://{parsed_url.netloc}{parsed_url.path}"

            # Only include links within the documentation
            if parsed_url.netloc == parsed_base.netloc and full_url.startswith(
                base_url
            ):
                # Skip non-HTML resources and source files
                skip_extensions = [
                    ".pdf",
                    ".zip",
                    ".png",
                    ".jpg",
                    ".jpeg",
                    ".gif",
                    ".svg",
                    ".css",
                    ".js",
                    ".txt",
                    ".rst",
                    ".md",
                    ".csv",
                    ".json",
                    ".py",
                    ".ipynb",
                    ".xml",
                    ".yaml",
                    ".yml",
                ]
                skip_patterns = ["/_images/", "/_static/", "/_sources/", "/_downloads/"]

                if any(full_url.lower().endswith(ext) for ext in skip_extensions):
                    continue
                if any(pat in full_url for pat in skip_patterns):
                    continue
                links.add(full_url)

        return links

    def extract_mkdocs_content(
        self, soup: BeautifulSoup, url: str, source_name: str
    ) -> List[Document]:
        """Extract content from MkDocs-style pages (DesignSafe uses ReadTheDocs theme)."""
        documents = []

        # Find main content area - DesignSafe uses ReadTheDocs theme with tacc_readthedocs div
        main_content = (
            soup.find("div", id="tacc_readthedocs")
            or soup.find("div", class_="rst-content")
            or soup.find("div", class_="document")
            or soup.find("div", {"role": "main"})
            or soup.find("article", class_="md-content__inner")
            or soup.find("main")
            or soup.find("article")
        )

        if not main_content:
            return documents

        # Get page title
        title_tag = main_content.find("h1") or soup.find("h1")
        page_title = (
            title_tag.get_text(strip=True)
            if title_tag
            else urlparse(url).path.split("/")[-2]
        )

        # Remove navigation, breadcrumbs, scripts, styles
        for elem in main_content.find_all(["nav", "footer", "script", "style"]):
            elem.decompose()
        for elem in main_content.find_all(class_=["headerlink", "fa-link"]):
            elem.decompose()

        # Extract by headers - works for DesignSafe's simple structure
        current_section = page_title
        current_content = []
        current_anchor = ""

        # Get all relevant elements in order
        for element in main_content.find_all(
            [
                "h1",
                "h2",
                "h3",
                "h4",
                "p",
                "ul",
                "ol",
                "pre",
                "table",
                "dl",
                "blockquote",
            ]
        ):
            if element.name in ["h1", "h2", "h3", "h4"]:
                # Save previous section
                if current_content:
                    text = "\n".join(current_content).strip()
                    if text and len(text) > 30:
                        section_url = (
                            f"{url}#{current_anchor}" if current_anchor else url
                        )
                        documents.append(
                            Document(
                                text=text,
                                metadata={
                                    "title": page_title,
                                    "section": current_section,
                                    "url": section_url,
                                    "source": source_name,
                                },
                            )
                        )

                # Start new section
                current_section = element.get_text(strip=True)
                current_anchor = element.get("id", "")
                current_content = []
            else:
                text = element.get_text(separator=" ", strip=True)
                if text and len(text) > 10:  # Skip very short elements
                    current_content.append(text)

        # Don't forget last section
        if current_content:
            text = "\n".join(current_content).strip()
            if text and len(text) > 30:
                section_url = f"{url}#{current_anchor}" if current_anchor else url
                documents.append(
                    Document(
                        text=text,
                        metadata={
                            "title": page_title,
                            "section": current_section,
                            "url": section_url,
                            "source": source_name,
                        },
                    )
                )

        return documents

    def extract_sphinx_content(
        self, soup: BeautifulSoup, url: str, source_name: str
    ) -> List[Document]:
        """Extract content from Sphinx-style pages (SimCenter)."""
        documents = []

        # Find main content area
        main_content = (
            soup.find("div", class_="document")
            or soup.find("div", class_="body")
            or soup.find("main")
            or soup.find("article")
        )

        if not main_content:
            return documents

        # Get page title
        title_tag = soup.find("title")
        page_title = title_tag.get_text(strip=True) if title_tag else ""
        # Clean up title
        for sep in [" — ", " - ", " | "]:
            if sep in page_title:
                page_title = page_title.split(sep)[0].strip()
                break

        # Remove navigation, sidebar, footer elements
        for elem in main_content.find_all(["nav", "footer", "script", "style"]):
            elem.decompose()
        for elem in main_content.find_all(
            class_=[
                "sidebar",
                "navigation",
                "sphinxsidebar",
                "toctree-wrapper",
                "headerlink",
            ]
        ):
            elem.decompose()

        # Find all sections
        sections = main_content.find_all("section")

        if sections:
            for section in sections:
                section_id = section.get("id", "")
                header = section.find(["h1", "h2", "h3", "h4"])
                section_title = header.get_text(strip=True) if header else page_title

                # Get section text (excluding nested sections)
                text_parts = []
                for child in section.children:
                    if hasattr(child, "name"):
                        if child.name == "section":
                            continue  # Skip nested sections
                        if child.name in ["p", "ul", "ol", "pre", "table", "div", "dl"]:
                            text = child.get_text(separator=" ", strip=True)
                            if text:
                                text_parts.append(text)

                text = "\n".join(text_parts).strip()
                if text and len(text) > 50:
                    # Use page URL without section anchor for cleaner references
                    documents.append(
                        Document(
                            text=text,
                            metadata={
                                "title": page_title,
                                "section": section_title,
                                "url": url,  # Use base URL, not anchored
                                "source": source_name,
                            },
                        )
                    )
        else:
            # No sections, extract all content
            text = main_content.get_text(separator="\n", strip=True)
            if text and len(text) > 50:
                documents.append(
                    Document(
                        text=text,
                        metadata={
                            "title": page_title,
                            "section": page_title,
                            "url": url,
                            "source": source_name,
                        },
                    )
                )

        return documents

    def extract_jupyter_book_content(
        self, soup: BeautifulSoup, url: str, source_name: str
    ) -> List[Document]:
        """Extract content from Jupyter Book / Sphinx Book Theme pages."""
        documents = []

        # Find main content area - Jupyter Book / Sphinx Book Theme
        main_content = (
            soup.find("article", class_="bd-article")
            or soup.find("main", id="main-content")
            or soup.find("div", class_="bd-content")
            or soup.find("div", class_="content")
            or soup.find("main")
            or soup.find("article")
        )

        if not main_content:
            return documents

        # Get page title
        title_tag = main_content.find("h1") or soup.find("h1")
        page_title = (
            title_tag.get_text(strip=True)
            if title_tag
            else urlparse(url).path.split("/")[-1].replace(".html", "")
        )

        # Remove navigation elements
        for elem in main_content.find_all(["nav", "footer", "script", "style"]):
            elem.decompose()
        for elem in main_content.find_all(
            class_=["headerlink", "toc-entry", "cell_input", "cell_output"]
        ):
            elem.decompose()

        # Extract by sections
        sections = main_content.find_all("section")

        if sections:
            for section in sections:
                section_id = section.get("id", "")
                header = section.find(["h1", "h2", "h3", "h4"])
                section_title = header.get_text(strip=True) if header else page_title

                # Get section text
                text_parts = []
                for child in section.children:
                    if hasattr(child, "name"):
                        if child.name == "section":
                            continue
                        if child.name in [
                            "p",
                            "ul",
                            "ol",
                            "pre",
                            "div",
                            "dl",
                            "blockquote",
                        ]:
                            text = child.get_text(separator=" ", strip=True)
                            if text and len(text) > 10:
                                text_parts.append(text)

                text = "\n".join(text_parts).strip()
                if text and len(text) > 50:
                    documents.append(
                        Document(
                            text=text,
                            metadata={
                                "title": page_title,
                                "section": section_title,
                                "url": url,
                                "source": source_name,
                            },
                        )
                    )
        else:
            # Fallback: extract by headers
            current_section = page_title
            current_content = []

            for element in main_content.find_all(
                ["h1", "h2", "h3", "h4", "p", "ul", "ol", "pre", "div"]
            ):
                if element.name in ["h1", "h2", "h3", "h4"]:
                    if current_content:
                        text = "\n".join(current_content).strip()
                        if text and len(text) > 50:
                            documents.append(
                                Document(
                                    text=text,
                                    metadata={
                                        "title": page_title,
                                        "section": current_section,
                                        "url": url,
                                        "source": source_name,
                                    },
                                )
                            )
                    current_section = element.get_text(strip=True)
                    current_content = []
                else:
                    text = element.get_text(separator=" ", strip=True)
                    if text and len(text) > 10:
                        current_content.append(text)

            if current_content:
                text = "\n".join(current_content).strip()
                if text and len(text) > 50:
                    documents.append(
                        Document(
                            text=text,
                            metadata={
                                "title": page_title,
                                "section": current_section,
                                "url": url,
                                "source": source_name,
                            },
                        )
                    )

        return documents

    def normalize_url(self, url: str) -> str:
        """Normalize URL to avoid duplicates (index.html vs /)."""
        # Remove trailing slash
        url = url.rstrip("/")
        # Remove index.html
        if url.endswith("/index.html"):
            url = url[:-11]
        elif url.endswith("index.html"):
            url = url[:-10]
        return url

    def scrape_site(self, source_key: str) -> List[Document]:
        """Scrape an entire documentation site."""
        source = DOC_SOURCES[source_key]
        base_url = source["base_url"]
        source_name = source["name"]
        doc_type = source["type"]

        logger.info(f"Scraping {source_name} from {base_url}")

        all_documents = []
        visited = set()
        to_visit = deque([base_url])

        # max_pages = 0 means no limit
        while to_visit and (self.max_pages == 0 or len(visited) < self.max_pages):
            url = to_visit.popleft()

            # Normalize URL to avoid duplicates
            normalized_url = self.normalize_url(url)
            if normalized_url in visited:
                continue

            visited.add(normalized_url)
            limit_str = str(self.max_pages) if self.max_pages > 0 else "unlimited"
            logger.info(f"  [{len(visited)}/{limit_str}] {url}")

            soup = self.fetch_page(url)
            if not soup:
                continue

            # Extract content based on doc type
            if doc_type == "mkdocs":
                documents = self.extract_mkdocs_content(soup, url, source_name)
            elif doc_type == "jupyter-book":
                documents = self.extract_jupyter_book_content(soup, url, source_name)
            else:  # sphinx
                documents = self.extract_sphinx_content(soup, url, source_name)

            all_documents.extend(documents)

            # Find more links
            links = self.get_links(soup, base_url, url)
            for link in links:
                normalized_link = self.normalize_url(link)
                if normalized_link not in visited:
                    to_visit.append(link)

            # Be polite
            time.sleep(self.delay)

        logger.info(
            f"  Scraped {len(visited)} pages, extracted {len(all_documents)} document chunks"
        )
        return all_documents

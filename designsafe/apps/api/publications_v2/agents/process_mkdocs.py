"""
Utils for parsing mkdocs documentation for ingestion into a vector DB.
"""

import re
import logging
import os
from pathlib import Path
from typing import List, Dict
from urllib.parse import urljoin
from pydantic import BaseModel
import yaml

logger = logging.getLogger(__name__)


class Document(BaseModel):
    """
    Modle for representing a chunk of text.
    """

    text: str
    metadata: dict


def parse_mkdocs_config(config_path: str) -> Dict:
    """Parse MkDocs configuration to understand the site structure."""
    with open(config_path, "r", encoding="utf-8") as f:
        config = yaml.safe_load(f)
    return config


def extract_nav_structure(nav: List, parent_path: str = "") -> List[Dict]:
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
                                "url": build_url(content),
                                "section": parent_path,
                            }
                        )
                elif isinstance(content, list):
                    # This is a section with sub-pages
                    new_parent = f"{parent_path}/{title}" if parent_path else title
                    pages.extend(extract_nav_structure(content, new_parent))

    return pages


def build_url(md_file: str) -> str:
    """Build the full URL from a markdown file path."""
    # Remove .md extension and handle special cases
    base_url = os.environ.get(
        "DOCS_BASE_URL", "https://www.designsafe-ci.org/user-guide/"
    )
    if md_file == "index.md":
        return base_url

    url_path = md_file.replace(".md", "/").replace("index/", "")
    return urljoin(base_url, url_path)


# pylint: disable=too-many-locals
def extract_sections_from_markdown(content: str, file_info: Dict) -> List[Document]:
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
                    anchor = create_anchor(current_section.split(" / ")[-1])
                    section_url = (
                        f"{file_info['url']}#{anchor}" if anchor else file_info["url"]
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
            anchor = create_anchor(current_section)
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


def create_anchor(text: str) -> str:
    """Create an anchor link from section title (following common markdown conventions)."""
    # Convert to lowercase and replace spaces with hyphens

    # Alias capture group to capture patterns of type { #anchor-alias } at end of markdown string
    # If an alias exists, we use that as the anchor rather than the section title.
    anchor = text.lower()

    alias_pattern = r"\{\s*\#(\S+)\s*\}\s*$"
    alias_match = re.findall(alias_pattern, text)

    if alias_match:
        anchor = alias_match[0].lower()

    # Remove special characters except hyphens and underscores
    anchor = re.sub(r"[^\w\s-]", "", anchor)
    # Replace spaces with hyphens
    anchor = re.sub(r"\s+", "-", anchor)
    # Remove duplicate hyphens
    anchor = re.sub(r"-+", "-", anchor)
    # Strip leading/trailing hyphens
    anchor = anchor.strip("-")

    return anchor


def process_markdown_files(docs_dir: str = "/docs"):
    """Process all markdown files from the documentation directory."""
    docs_path = Path(docs_dir) / "user-guide"

    # Parse MkDocs config
    config_path = Path(f"{docs_dir}/mkdocs.yml")
    config = parse_mkdocs_config(str(config_path))

    # Extract navigation structure
    nav_pages = extract_nav_structure(config.get("nav", []))

    all_documents = []

    for page_info in nav_pages:
        if page_info["file"] and not page_info["file"].startswith("http"):
            file_path = docs_path / page_info["file"]

            if file_path.exists():
                logger.info(f"Processing: {page_info['file']}")

                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()

                # Extract sections from the markdown file
                documents = extract_sections_from_markdown(content, page_info)
                all_documents.extend(documents)

                logger.info(
                    f"  Extracted {len(documents)} sections from {page_info['file']}"
                )
            else:
                logger.warning(f"File not found: {file_path}")

    logger.info(f"Total documents extracted: {len(all_documents)}")
    return all_documents

import os
from urllib import parse
import neo4j
from neo4j import Transaction
from django.conf import settings
import networkx as nx
import httpx
import openai
from celery import shared_task
from pydantic_ai.format_prompt import format_as_xml

SUMMARIZE_PROMPT = """
    You are a helpful assistant responsible for generating a comprehensive summary of the data provided below.
    Given an XML representation of a published project, with the labels and properties provided.
    Please concatenate all of these into a single, comprehensive description. Make sure to include information collected from all the descriptions, keywords, events, and other properties. Write in complete sentences without bullet points. Ignore UUIDs in favor of the projectID field.
    If the provided descriptions are contradictory, please resolve the contradictions and provide a single, coherent summary.
    Make sure it is written in third person. Response should be about 1000 words. Format the output as a set of paragraphs, where each paragraph is 50-100 words and contains a clear central idea. Print one paragraph per line, and DO NOT include any blank lines.

    #######
    -Data-
    Tree: {tree}
    #######
    Output:
    """


def get_summary(project_id) -> str:
    """
    Summarize a publication as natural language.
    """
    model = "gpt-4o-mini"

    oai_client = openai.OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
    pub = get_publication(project_id)
    tree = format_as_xml(pub["tree"])
    summarize_output = oai_client.responses.create(
        model=model, input=SUMMARIZE_PROMPT.format(tree=tree)
    )
    return summarize_output.output_text


def get_summary_chunks(project_id: str) -> list[str]:
    """
    Return summarization output as an array of chunks for indexing in a vector db.
    """
    summary_value = get_summary(project_id).split("\n")
    return [s for s in summary_value if s]


def get_summary_embeddings(summary_chunks: list[str]):
    """
    Generate vector embeddings for a chunked summary.
    """
    openai_client = openai.OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
    embedding_resp = openai_client.embeddings.create(
        model="text-embedding-ada-002", input=summary_chunks
    )
    return zip(summary_chunks, [e.embedding for e in embedding_resp.data])


def merge_summary_chunk(project_id, chunk):
    """
    Insert a summary chunk and its vector embedding into the neo4j database.
    """
    neo4j_client = neo4j.GraphDatabase.driver(
        settings.NEO4J_URL, auth=("neo4j", settings.NEO4J_PASS)
    )

    merge_embedding_query = """
    MERGE (s: Summary {text: $text, embedding: $embedding, projectId: $project_id})
    WITH s
    MATCH (c: Collection {id: $project_id})
    MERGE (c)-[:HAS_SUMMARY]->(s)
    """
    neo4j_client.execute_query(
        merge_embedding_query, project_id=project_id, text=chunk[0], embedding=chunk[1]
    )


def clear_summary_chunks(project_id):
    """
    Delete embedded summaries for a project.
    """
    neo4j_client = neo4j.GraphDatabase.driver(
        settings.NEO4J_URL, auth=("neo4j", os.environ.get("NEO4J_PASS"))
    )
    clear_embeddings_query = """
    MATCH (c: Collection {id: $project_id})-[:HAS_SUMMARY]->(s)
    DETACH DELETE s 
    """

    neo4j_client.execute_query(clear_embeddings_query, project_id=project_id)


def index_summaries_for_publication(project_id):
    """
    Generate, embed and index summary information for a project.
    """
    text_chunks = get_summary_chunks(project_id)
    clear_summary_chunks(project_id)
    embeddings = get_summary_embeddings(text_chunks)
    for chunk in embeddings:
        merge_summary_chunk(project_id, chunk)


def get_search_url(query: str):
    """
    Generate a URL to a specific search query in the publications listing.
    """
    base_search_url = (
        "https://www.designsafe-ci.org/data/browser/public/designsafe.storage.published"
    )
    return f"{base_search_url}?q={parse.quote_plus(query)}"


def get_publication(project_id: str) -> dict:
    """Retrieve published metadata using the project ID."""

    pub_listing_url = "https://www.designsafe-ci.org/api/publications/v2"
    res = httpx.get(f"{pub_listing_url}/{project_id}")
    return res.json()


def get_file_url(file_obj: dict, project_id: str) -> str:
    """
    Construct a URL to a directory or the parent dir of a file.
    """
    base_url = f"https://www.designsafe-ci.org/data/browser/public/designsafe.storage.published/{project_id}"
    file_type = file_obj.get("type")
    if file_type == "dir":
        full_url = f"{base_url}/{parse.quote(file_obj['path'], safe='')}"
    else:
        dirname = parse.quote(os.path.dirname(file_obj["path"]), safe="")
        full_url = f"{base_url}/{dirname}".replace("//", "/")

    return full_url


def merge_files(
    tx: Transaction,
    project_id: str,
    collection_id: str,
    file_objs: list[dict],
    file_tags: list[dict] = None,
):
    """Merge files and tags into the graph db."""
    if not file_tags:
        file_tags = []
    merge_query = """
    MERGE (f: File {path: $path})

    SET f += {type: $type, 
               name: $name,
               length: $length, 
               system: $system,
               url: $url, 
               lastModified: $lastModified}
    WITH f
    MATCH (c: Collection {id: $collection_id})
    MERGE (c)-[:HAS_FILE]->(f)

    """

    tag_merge_query = """
    MERGE (t: FileTag {tag: $tag_name})
    WITH t
    MATCH (f: File {path: $path})
    MERGE (f)-[:HAS_TAG]->(t)
    """
    for fo in file_objs:
        tx.run(
            merge_query,
            collection_id=collection_id,
            path=fo["path"],
            type=fo.get("type"),
            name=fo.get("name"),
            length=fo.get("length"),
            system=fo.get("system"),
            url=get_file_url(fo, project_id),
            lastModified=fo.get("lastModified"),
        )

    for ft in file_tags:
        if ft.get("path"):
            tx.run(tag_merge_query, tag_name=ft["tagName"], path=ft["path"])


def merge_keywords(tx: Transaction, collection_id: str, keywords: list[str]) -> None:
    """Merge project keywords into the graph db."""
    kw_merge_query = """
    MERGE (k: Keyword {keyword: $keyword})
    WITH k
    MATCH (c: Collection {id: $collection_id})
    MERGE (c)-[:HAS_KEYWORD]->(k)
    """

    for kw in keywords:
        tx.run(kw_merge_query, keyword=kw, collection_id=collection_id)


def merge_authors(tx: Transaction, collection_id: str, authors: list[dict]):
    """Merge authors into the graph db."""
    merge_query = """
    MERGE (u: Author {name: $fullname, email: $email})
    MERGE (i: Institution {name: $inst})
    
    SET u += {email: $email, 
               username: $username,
               url: $url}
    WITH u, i
    MATCH (c: Collection {id: $collection_id})
    MERGE (c)-[:HAS_AUTHOR {role: $role, order: $order}]->(u)
    MERGE (u)-[:HAS_INSTITUTION]->(i)
   
    """
    for i, author in enumerate(authors):
        tx.run(
            merge_query,
            collection_id=collection_id,
            fullname=f"{author['fname']} {author['lname']}",
            url=get_search_url(f"{author['fname']} {author['lname']}"),
            email=author.get("email", "N/A"),
            order=i,
            role=author.get("role", "author"),
            inst=author.get("inst", "N/A"),
            username=author.get("username"),
        )


def merge_related_work(tx: Transaction, collection_id: str, related_works: list[dict]):
    """Merge related works into the graph db."""
    merge_query = """
    MERGE (rw: RelatedWork {title: $title})

    SET rw += {title: $title, 
               href: $href,
               hrefType: $href_type, 
               doi: $doi}
    WITH rw
    MATCH (c: Collection {id: $collection_id})
    MERGE (c)-[:HAS_RELATED_WORK {type: $type}]->(rw)
    """
    for rw in related_works:
        tx.run(
            merge_query,
            collection_id=collection_id,
            title=rw["title"],
            href=rw.get("href"),
            href_type=rw.get("hrefType"),
            doi=rw.get("doi"),
            type=rw.get("type", "Linked Dataset"),
        )


def merge_referenced_data(
    tx: Transaction, collection_id: str, referenced_data: list[dict]
):
    """Merge referenced data into the graph db."""
    merge_query = """
    MERGE (rd: ReferencedData {doi: $doi})

    SET rd += {title: $title, 
               hrefType: $href_type, 
               doi: $doi}
    WITH rd
    MATCH (c: Collection {id: $collection_id})
    MERGE (c)-[:HAS_REFERENCED_DATA ]->(rd)
    """
    for rd in referenced_data:
        tx.run(
            merge_query,
            collection_id=collection_id,
            doi=rd["doi"],
            title=rd.get("title"),
            href_type=rd.get("hrefType"),
        )


def merge_nh_events(tx: Transaction, collection_id: str, events: list[dict]):
    """Merge natural hazard events into the graph db."""
    merge_query = """
    MERGE (evt: NaturalHazardEvent {name: $event_name})

    SET evt += {startDate: datetime($event_start), 
               endDate: datetime($event_end), 
               location: $location,
               latitude: $latitude,
               longitude: $longitude}
    WITH evt
    MATCH (c: Collection {id: $collection_id})
    MERGE (c)-[:HAS_EVENT ]->(evt)
    """

    for evt in events:
        tx.run(
            merge_query,
            collection_id=collection_id,
            event_name=evt["eventName"],
            event_start=evt.get("eventStart"),
            event_end=evt.get("eventEnd"),
            location=evt.get("location"),
            latitude=evt.get("latitude"),
            longitude=evt.get("longitude"),
        )


def merge_facilities(tx: Transaction, collection_id: str, facilities: list[dict]):
    """Merge facility information into the graph db."""
    merge_query = """
    MERGE (fac: Facility {name: $name, url: $url})
    WITH fac
    MATCH (c: Collection {id: $collection_id})
    MERGE (c)-[:HAS_FACILITY ]->(fac)
    """
    for fac in facilities:
        tx.run(
            merge_query,
            collection_id=collection_id,
            name=fac["name"],
            url=f"https://www.designsafe-ci.org/data/browser/public/designsafe.storage.published?facility={fac['id']}",
        )


def merge_funding(tx: Transaction, collection_id: str, awards: list[dict]):
    """Merge funding sources into the graph db."""
    merge_query = """
    MERGE (f: Funding {name: $name})
    SET f.fundingSource=$funding_source
    WITH f
    MATCH (c: Collection {id: $collection_id})
    MERGE (c)-[:HAS_FUNDING ]->(f)
    """

    for award in awards:
        if award.get("name"):
            tx.run(
                merge_query,
                collection_id=collection_id,
                name=award["name"],
                funding_source=award.get("fundingSource"),
            )


def merge_dropdown_values(
    tx: Transaction,
    collection_id: str,
    node_label: str,
    relation_label: str,
    values: list[dict],
):
    """Generic handler for merging dropdown values with a name and label."""

    merge_query = f"""
    MERGE (v: {node_label} {{name: $name}})
    WITH v
    MATCH (c: Collection {{id: $collection_id}})
    MERGE (c)-[:{relation_label} ]->(v)
    """

    for kv in values:
        tx.run(merge_query, collection_id=collection_id, name=kv["name"])


def ingest_publication(client: neo4j.Driver, project_id: str):
    """
    Ingest a full publication into the graph db.
    """
    res = get_publication(project_id)
    tree_graph = nx.tree_graph(res["tree"])

    with client.session() as sess:
        merge_query = """
        MERGE (p:Collection {id: $id})
        SET p = {id: $id}
        SET p += {title: $title, 
                description: $description,
                doi: $doi,
                version: $version,
                projectId: $project_id,
                url: $url,
                publicationDate: datetime($publication_date),
                type: $name }
        """
        relation_query = """
        MATCH (p:Collection {id: $parent_id})
        WITH p
        MATCH (c: Collection {id: $child_id})
        MERGE (p)-[:HAS_CHILD]->(c)
        """

        with sess.begin_transaction() as tx:
            for node in tree_graph.nodes:
                node_value = tree_graph.nodes[node].get("value", {})
                neo4j_node_id = node
                if node == "NODE_ROOT":
                    neo4j_node_id = project_id

                doi_attr = node_value.get("dois", None)
                doi = doi_attr[0] if doi_attr else None

                version = tree_graph.nodes[node].get("version", 1)
                tx.run(
                    merge_query,
                    id=neo4j_node_id,
                    title=node_value.get("title"),
                    version=version,
                    description=node_value.get("description"),
                    url=f"https://www.designsafe-ci.org/data/browser/public/designsafe.storage.published/{project_id}",
                    publication_date=tree_graph.nodes[node].get("publicationDate"),
                    name=tree_graph.nodes[node]["name"],
                    doi=doi,
                    project_id=project_id,
                )

                if file_objs := node_value.get("fileObjs", None):
                    merge_files(
                        tx,
                        project_id,
                        neo4j_node_id,
                        file_objs,
                        node_value.get("fileTags", []),
                    )

                if keywords := node_value.get("keywords", None):
                    merge_keywords(tx, neo4j_node_id, keywords)

                if authors := node_value.get("authors", None):
                    merge_authors(tx, neo4j_node_id, authors)

                if related_works := node_value.get(
                    "associatedProjects", None
                ) or node_value.get("relatedWork", None):
                    merge_related_work(tx, neo4j_node_id, related_works)

                if referenced_data := node_value.get("referencedData"):
                    merge_referenced_data(tx, neo4j_node_id, referenced_data)

                if nh_events := node_value.get("nhEvents"):
                    merge_nh_events(tx, neo4j_node_id, nh_events)

                if facilities := node_value.get("facilities", None):
                    merge_facilities(tx, neo4j_node_id, facilities)
                if facility := node_value.get("facility", None):
                    merge_facilities(tx, neo4j_node_id, [facility])

                if awards := node_value.get("awardNumbers", None):
                    merge_funding(tx, neo4j_node_id, awards)

                if data_types := (
                    node_value.get("nhTypes", [])
                    + node_value.get("frTypes", [])
                    + node_value.get("dataTypes", [])
                ):
                    merge_dropdown_values(
                        tx,
                        neo4j_node_id,
                        node_label="NaturalHazardType",
                        relation_label="HAS_NATURAL_HAZARD_TYPE",
                        values=data_types,
                    )

            for parent, child in nx.dfs_edges(tree_graph, "NODE_ROOT"):
                if parent == "NODE_ROOT":
                    parent = project_id
                tx.run(
                    relation_query,
                    parent_id=parent,
                    child_id=child,
                )
            tx.commit()


@shared_task
def neo4j_ingest_publication_async(project_id: str):
    """Async wrapper around neo4j indexing utils."""
    neo4j_client = neo4j.GraphDatabase.driver(
        settings.NEO4J_URL, auth=("neo4j", settings.NEO4J_PASS)
    )
    ingest_publication(neo4j_client, project_id)
    index_summaries_for_publication(project_id)

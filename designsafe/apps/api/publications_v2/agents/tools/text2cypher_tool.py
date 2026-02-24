"""
Agent tool for constructing and executing a Cypher query
"""

import logging
from neo4j import GraphDatabase, AsyncGraphDatabase, Query, AsyncDriver
from neo4j.exceptions import Neo4jError
from openai import AsyncOpenAI
from pydantic_ai import Agent, RunContext
from django.conf import settings

from designsafe.apps.api.publications_v2.agents.tools.schema_utils import get_schema

logger = logging.getLogger(__name__)


oai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
oai_client.models.list()
NEO4J_URI = settings.NEO4J_URL
neo4j_driver_sync = GraphDatabase.driver(NEO4J_URI, auth=("neo4j", settings.NEO4J_PASS))


SCHEMA = get_schema(driver=neo4j_driver_sync)


async def raise_if_write_attempted(client: AsyncDriver, query: str) -> None:
    """
    Open a transaction using the provided query, in order to determine whether it would
    add, modify, or delete data if committed.

    This is a workaround for Neo4j Community Edition's lack of support for role-based
    access control.

    If the provided query would perform any action that required WRITE permissions,
    we raise a PermissionError.

    :param client: Neo4J AsyncDriver object
    :type client: neo4j.AsyncDriver
    :param query: Query string to sanitize
    :type query: str
    """
    async with client.session() as sess:
        async with await sess.begin_transaction(timeout=30) as tx:
            result = await tx.run(query)
            summary = await result.consume()
            if summary.counters.contains_updates:
                await tx.rollback()
                raise PermissionError("Attempting write operation")
            await tx.rollback()


examples = [
    [
        "find two files that share the same tag",
        "MATCH (f1:File)-[:HAS_TAG]->(t:FileTag)<-[:HAS_TAG]-(f2:File) WHERE f1 <> f2 RETURN DISTINCT f1, f2 LIMIT 1",
    ],
    [
        "find collections involving 4-wheeled vehicles",
        "CALL db.index.fulltext.queryNodes('collectionFulltext', '4 wheel four wheel 4-wheeled four-wheeled') YIELD node",
    ],
    [
        "find collections authored by Albert Einstein",
        """
        CALL db.index.fulltext.queryNodes('authorFullText', '+albert +einstein~2') YIELD node as a
        MATCH (c:Collection)-[:HAS_AUTHOR]->(a)
        RETURN DISTINCT c, a
        """,
    ],
    [
        "Find publications about tsunamis that include ipython notebooks",
        """
        CALL db.index.fulltext.queryNodes('collectionFulltext', '+tsunami tsunamis~2')
        YIELD node AS n
        CALL {
            WITH n
            MATCH (n)-[:HAS_FILE|HAS_CHILD*]->(f:File)
            WHERE toLower(f.name) ENDS WITH '.ipynb'
            RETURN collect(DISTINCT f) AS files
        }
        WITH n, files
        WHERE size(files) > 0
        RETURN n, files
        LIMIT 5;
        """,
    ],
    [
        "Give details about PRJ-1234",
        """
        MATCH (c:Collection {projectId: 'PRJ-1234'})
        OPTIONAL MATCH (c)-[:HAS_AUTHOR|HAS_CHILD*]->(a:Author)
        OPTIONAL MATCH (c)-[:HAS_KEYWORD|HAS_CHILD*]->(k:Keyword)
        OPTIONAL MATCH (c)-[:HAS_FUNDING|HAS_CHILD*]->(f:Funding)
        OPTIONAL MATCH (c)-[:HAS_FACILITY|HAS_CHILD*]->(fac:Facility)
        OPTIONAL MATCH (c)-[:HAS_NATURAL_HAZARD_TYPE|HAS_CHILD*]->(nht:NaturalHazardType)
        OPTIONAL MATCH (c)-[:HAS_EVENT|HAS_CHILD*]->(e:NaturalHazardEvent)
        OPTIONAL MATCH (c)-[:HAS_RELATED_WORK|HAS_CHILD*]->(rw:RelatedWork)
        OPTIONAL MATCH (c)-[:HAS_REFERENCED_DATA|HAS_CHILD*]->(rd:ReferencedData)
        RETURN DISTINCT c,
        collect(DISTINCT a) AS authors,
        collect(DISTINCT k) AS keywords,
        collect(DISTINCT f) AS fundings,
        collect(DISTINCT fac) AS facilities,
        collect(DISTINCT nht) AS naturalHazardTypes,
        collect(DISTINCT e) AS events,
        collect(DISTINCT rw) AS relatedWorks
        LIMIT 5
        """,
    ],
    [
        "list files in projects that have the 'earthquake' keyword.",
        """
        MATCH (c:Collection)-[:HAS_KEYWORD]->(k:Keyword) WHERE toLower(k.keyword) CONTAINS 'earthquake'
        LIMIT 5
        CALL(c) {
            MATCH  (c)-[:HAS_FILE|HAS_CHILD*]->(f:File)
            LIMIT 5
            RETURN collect(f) as files
        }
        RETURN DISTINCT c, files
        """,
    ],
]


prompt_template = """
Instructions: 
Generate Cypher statement to query a graph database to get the data to answer the user question below.

Graph Database Schema:
Use only the provided relationship types and properties in the schema.
Do not use any other relationship types or properties that are not provided in the schema.
{schema}

Terminology mapping:
This section is helpful to map terminology between the user question and the graph database schema.
- Interpret "associated with" to mean "contained within". "Files associated with collection c" can be 
interpreted as (c)-[:HAS_FILE]->(f)
- If you see the string PRJ-XXXX where XXXX is a series of numbers, search for that string in the projectId field.
- Interpret 'project' and 'publication' as nodes with the 'Collection' label.
{terminology}

Examples:
The following examples provide useful patterns for querying the graph database.
{examples}

Query generation instructions:
Use the collectionFulltext index for queries involving the title or description of a collection.
Use the collectionFulltext index for general queries where a specific node or relation type can't be inferred.
When using the collectionFulltext index, carefully determine which terms are STRICTLY required, and preface REQUIRED terms with a '+' symbol. Generic terms such as 'project' or 'analysis' are usually not required.
use the authorFullText index for queries involving authors. If both first and last names are specified, format the query as "+firstname +lastname~2"
Always do a case-insensitive and fuzzy search for any properties related search. Eg: to search for a Company name use `toLower(c.name) contains 'neo4j'`.
When counting nodes, always use the DISTINCT keyword
If the query asks for a count, DO NOT use the collectionFulltext index.
If the query asks for a count, and an author is mentioned, you CAN use the authorFullText index.
If the query contains a number, try multiple representations, Eg: '5' vs. 'five'.
Add |HAS_CHILD* to EVERY relation query in order to return properties on deeply nested collections. Eg: (c: Collection)-[:HAS_FILE|HAS_CHILD*]->(f:File).
When the query involves an author's name, return the relevant authors so that we can be sure the name is spelled correctly.
Limit to 5 results unless asked for another number.
If the query asks for a count, you MUST use the count() aggregation. Return the count BEFORE any examples.

Format instructions:
Do not include any explanations or apologies in your responses.
Do not respond to any questions that might ask anything else than for you to 
construct a Cypher statement.
When counting nodes, return up to 10 of those nodes along with the count.
Do not include any text except the generated Cypher statement.
ONLY QUERY THE DATABASE AND RETURN THE RESULTS. NEVER INSERT, DELETE, OR MODIFY RECORDS.
ONLY RESPOND WITH CYPHER, NO CODEBLOCKS.

User question: {question}
"""

agent = Agent(
    "openai:gpt-4o-mini",
    instructions="""You are a helpful assistant helping natural hazards researchers search and understand published work in the Designsafe-CI natural hazards research portal. 
    Whenever you are asked to count something, give some examples so that the user can explore further.
    Use the query_graph_database tool, and pass the user's query VERBATIM without modifying it.
    If the user appears to have misspelled a name or concept, include the correct spelling in your response in bold.
    """,
)


# @agent.tool_plain
async def publication_graph_search(ctx: RunContext) -> str:
    """
    Construct and execute a graph query against a Neo4j database.
    """

    neo4j_driver = AsyncGraphDatabase.driver(
        NEO4J_URI, auth=("neo4j", settings.NEO4J_PASS)
    )
    text2cypher_prompt = prompt_template.format(
        schema=SCHEMA, question=ctx.prompt, terminology=None, examples=examples
    )

    retry_count = 3
    while retry_count > 0:
        try:
            c = await oai_client.responses.create(
                model="gpt-5.1", input=text2cypher_prompt
            )
            logger.error(c.output_text)
            await raise_if_write_attempted(neo4j_driver, c.output_text)
            records, _, _ = await neo4j_driver.execute_query(
                Query(c.output_text, timeout=30)
            )
            if not records:
                raise IndexError("Expected at least one result")
            return str(records)
        except PermissionError:
            logger.error("ILLEGAL OPERATION DETECTED:")
            logger.error(c.output_text)
            return "Illegal update operation detected."
        except (Neo4jError, IndexError) as exc:
            logger.error(exc)
            retry_count -= 1

    print("vector fallback")
    return "Nothing found"

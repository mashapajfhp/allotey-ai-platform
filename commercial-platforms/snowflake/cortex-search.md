# Cortex Search -- Hybrid Search for RAG and Enterprise Search

> STATUS: RESEARCH COMPLETE | Last updated: 2026-08-13

## What Cortex Search Does

Cortex Search provides a fully managed hybrid search engine over text data in
Snowflake. It combines vector search, keyword search, and semantic reranking
into a single service that requires no manual embedding pipeline, index tuning,
or infrastructure management.

The two primary use cases are:
1. **RAG (Retrieval Augmented Generation)**: feeding relevant context to LLMs.
2. **Enterprise search**: powering search bars in applications.

---

## Architecture: Three-Stage Hybrid Retrieval

Every query passes through three stages:

### Stage 1: Vector Search
- Retrieves semantically similar documents using dense vector embeddings.
- Captures meaning even when the query uses different words than the source.

### Stage 2: Keyword Search
- Retrieves lexically similar documents using traditional keyword/BM25 matching.
- Catches exact terms, product codes, and proper nouns that vector search
  may miss.

### Stage 3: Semantic Reranking
- A reranking model scores the combined candidate set from stages 1 and 2.
- Reorders results by relevance, producing the final ranked list.

This hybrid approach achieves high search quality across diverse datasets
without requiring parameter tuning per dataset.

---

## Creating a Cortex Search Service

A Cortex Search service is defined over a source table and column:

```sql
CREATE CORTEX SEARCH SERVICE my_search_service
  ON my_table(text_column)
  TARGET_LAG = '1 hour'
  WAREHOUSE = my_warehouse;
```

Key properties:
- **TARGET_LAG**: how fresh the index should be (controls refresh frequency).
- **WAREHOUSE**: compute used for index building and refreshes.
- The service automatically handles chunking, embedding, and index creation.

---

## 2026 Updates (GA as of March 2026)

### Custom Embeddings
You can now create Cortex Search services that use **pre-computed vector
embeddings** instead of, or in addition to, Snowflake-provided embeddings.
This enables:
- Using your own fine-tuned embedding models.
- Integrating third-party embedding providers.
- Combining custom embeddings with Snowflake's built-in hybrid retrieval.

### Batch Cortex Search
For high-throughput workloads (e.g., batch evaluation, bulk classification),
Snowflake introduced **Batch Cortex Search** that processes many queries
in parallel without the overhead of individual API calls.

### Dynamic Search Behavior
The Cortex Search tool (when used by Cortex Agents) now supports:
- **Service selection**: the agent can query a single search service based on
  tool descriptions rather than querying all services, reducing latency/cost.
- **Multi-index search**: query across multiple search indices with
  index-specific boosts to weight results.

> NEEDS VERIFICATION: Multi-index boost syntax and whether it is GA or preview.

---

## Integration with Cortex Agents

When used as a tool by Cortex Agents, Cortex Search provides the unstructured
data retrieval capability. The agent decides when to invoke search vs. analyst
based on the question type:

- "What is our refund policy?" --> Cortex Search (document retrieval)
- "What was total revenue last quarter?" --> Cortex Analyst (SQL generation)
- "Summarize our HR policies and show headcount by department" --> Both

---

## Access Control

Cortex Search services inherit Snowflake's governance:
- Access to the search service is controlled by RBAC (roles/privileges).
- The underlying table's row-level security and masking policies apply.
- Results only include data the querying user is authorized to see.

---

## Comparison: Cortex Search vs. External Vector Databases

| Aspect | Cortex Search | External (Pinecone, Weaviate, etc.) |
|---|---|---|
| Embedding management | Automatic (or bring your own) | You manage the pipeline |
| Index refresh | Automatic with TARGET_LAG | You build the sync pipeline |
| Hybrid retrieval | Built-in (vector + keyword + rerank) | Varies by provider |
| Governance | Inherits Snowflake RBAC, masking, RLS | Separate auth system |
| Data movement | None -- data stays in Snowflake | Must export/sync data |
| Tuning required | Minimal | Significant (chunk size, overlap, k, etc.) |
| Vendor lock-in | Yes (Snowflake-native) | Can switch providers |

---

## Limitations

- Cortex Search is optimized for text data. Structured numeric analytics
  should use Cortex Analyst instead.
- The YAML spec / service definition has size limits (NEEDS VERIFICATION on
  exact limits for search services).
- Cross-account replication of search services is not supported.
- Search quality depends on the quality and structure of the source text --
  poorly structured documents produce poor results regardless of the engine.

---

## Relevance to Allotey

Cortex Search demonstrates that **hybrid retrieval (vector + keyword + rerank)
is the standard for production search quality**. Any RAG or enterprise search
system should combine these three stages rather than relying on vector search
alone. The auto-refresh mechanism (TARGET_LAG) is also worth studying -- it
abstracts away the complexity of keeping search indices synchronized with
source data.

---

## Sources

- [Cortex Search Overview](https://docs.snowflake.com/en/user-guide/snowflake-cortex/cortex-search/cortex-search-overview)
- [March 2026 GA Release Notes](https://docs.snowflake.com/en/release-notes/2026/other/2026-03-12-recent-cortex-search)
- [Batch Cortex Search](https://medium.com/snowflake/introducing-batch-cortex-search-hybrid-search-engine-for-high-throughput-workloads-8ef961d64f5c)
- [Cortex Search Blog Post](https://www.snowflake.com/en/blog/cortex-search-ai-hybrid-search/)

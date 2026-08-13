# AI Search, Vector Search, and Mosaic AI Retrieval

STATUS: RESEARCH COMPLETE -- August 2026

## Overview

**Databricks AI Search** (formerly Databricks Vector Search / Mosaic AI Vector Search) is the platform's managed search solution for AI applications. It powers retrieval for RAG systems, recommender systems, and knowledge-based AI agents. AI Search is built into the Databricks platform, integrated with Unity Catalog governance, and designed to auto-sync with source Delta tables.

The rebranding from "Vector Search" to "AI Search" reflects the expansion beyond pure vector similarity to include hybrid search, reranking, and a higher-level knowledge base API (`ai_search()` SQL function).

## Core Capabilities

### Vector Search Indexes

AI Search indexes data from **Delta tables** and creates vector indexes that support similarity search:

- **Managed embeddings**: Databricks generates embeddings using Foundation Model APIs (e.g., BGE-M3, MXBai-large). No need to manage embedding models separately.
- **Self-managed embeddings**: Bring your own pre-computed embeddings stored in a Delta table column.
- **Auto-sync**: When the source Delta table changes, the vector index automatically updates. No manual re-indexing required.
- **Unity Catalog governance**: Indexes inherit permissions from the source table. If a user cannot access the table, they cannot query the index.

### Hybrid Search

As of 2026, hybrid search is the **default for most index types**:

- Combines **dense vector retrieval** (semantic similarity via embeddings) with **keyword retrieval** (BM25 sparse matching)
- Results from both retrieval methods are merged and re-ranked
- Set `query_type="hybrid"` to explicitly enable (though it is now default)
- Hybrid search includes all text metadata columns by default
- Returns a maximum of 200 results per query

### Reranking

Built-in reranking improves retrieval quality with a single parameter:

- Uses a Databricks-developed **compound AI system** for reranking
- Evaluates retrieved documents for semantic relevance to the query
- Average improvement of **15 percentage points** on enterprise benchmarks (Databricks' claim)
- Enabled with a single parameter in the search API
- Works on top of both vector and hybrid search results

### Filtering

- Metadata filters can narrow search scope (e.g., filter by document type, date range, department)
- Filters are applied before vector search, reducing the candidate set
- Filter columns must be defined when creating the index

## The ai_search() SQL Function (Beta)

A higher-level abstraction over raw vector search:

```sql
SELECT * FROM ai_search(
  query => 'What is our return policy for electronics?',
  index => 'catalog.schema.knowledge_base_index'
)
```

Capabilities:
- Accepts a natural language query
- Generates optimized search queries internally
- Retrieves and **deduplicates** results across multiple source indexes
- **Reranks** by relevance
- Optionally **synthesizes a grounded natural-language answer** over the retrieved documents
- Can query **multiple AI Search indexes** configured as knowledge sources

NEEDS VERIFICATION: Whether `ai_search()` has reached GA or remains in Beta as of August 2026. Last confirmed status was Beta.

## RAG Architecture on Databricks

The recommended RAG architecture on Databricks follows this pattern:

### Ingestion Pipeline
1. **Source data** in Delta tables or Volumes (PDFs, docs, HTML, etc.)
2. **Document parsing**: Extract text from unstructured documents (using Databricks document parsers or custom code)
3. **Chunking**: Split documents into chunks appropriate for embedding
4. **Embedding**: Generate embeddings via Foundation Model APIs or custom models
5. **Indexing**: Store chunks + embeddings in a Delta table; create an AI Search index on top

### Retrieval Pipeline
1. **User query** arrives (from an agent, application, or direct API call)
2. **AI Search** retrieves relevant chunks using hybrid search + reranking
3. **Context assembly**: Retrieved chunks are assembled into a prompt context
4. **Generation**: An LLM (via Model Serving or AI Gateway) generates a response grounded in the retrieved context
5. **Governance**: All steps respect Unity Catalog permissions; the user can only retrieve documents they have access to

### Key Integration Points
- **Delta tables as source of truth**: All documents/chunks live in governed Delta tables
- **Auto-sync indexes**: No separate ETL for keeping the vector index fresh
- **MLflow tracking**: RAG pipeline performance (retrieval quality, generation quality) tracked in MLflow experiments
- **Agent Evaluation**: Built-in evaluation framework measures retrieval precision, answer correctness, and groundedness

## Embedding Models

Recommended embedding models for Databricks AI Search (2026):

| Model | Notes |
|---|---|
| BGE-M3 | Strong multilingual default, good for general text |
| MXBai-large (Mosaic) | Databricks' own model, competitive with BGE-M3 |
| Custom models | Any embedding model can be deployed on Model Serving and used |

Embedding models can be accessed through:
- **Foundation Model APIs**: Pre-hosted models available via pay-per-token
- **Provisioned throughput**: Dedicated capacity for high-volume embedding workloads
- **External models**: Route to OpenAI, Cohere, etc. via AI Gateway

## AI Search as MCP Server

AI Search is available as a **Managed MCP Server**:

- MCP-compatible agents can query AI Search indexes directly
- Tool name: vector search query tool (exposes the search API)
- Inherits caller's Unity Catalog permissions
- Enables external agents to use Databricks knowledge bases for grounded retrieval

## Comparison with Alternatives

| Feature | Databricks AI Search | Pinecone | Weaviate | Snowflake Cortex Search |
|---|---|---|---|---|
| Managed service | Yes | Yes | Cloud/self-host | Yes |
| Auto-sync from source tables | Yes (Delta) | No | No | Yes (Snowflake tables) |
| Governance integration | Unity Catalog | Separate | Separate | Snowflake RBAC |
| Hybrid search | Yes (default) | Yes | Yes | Yes |
| Built-in reranking | Yes | No (bring own) | No (bring own) | NEEDS VERIFICATION |
| MCP server | Yes | No | No | No |
| Open source | No | No | Yes | No |

## Key Takeaway

The distinctive property of Databricks AI Search is that it is **not a standalone vector database** but a search layer that sits on top of governed Delta tables. The source of truth remains in the lakehouse, the index auto-syncs, and all access control is inherited from Unity Catalog. This eliminates the common problem of vector databases becoming ungoverned copies of data that drift from the source.

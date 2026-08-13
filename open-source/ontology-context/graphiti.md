# Graphiti (getzep/graphiti)

**Category:** Ontology / Context
**Repository:** https://github.com/getzep/graphiti
**License:** Apache 2.0 (with Contributor License Agreement)
**Language:** Python
**Stars:** 20,000+
**Status:** RESEARCH COMPLETE
**Last Verified:** 2026-08-13

---

## What Problem Does It Solve?

Graphiti solves the problem of agent memory that evolves over time. Standard knowledge graphs are static snapshots -- they capture what is true now but lose the history of change. Standard RAG retrieves similar text but has no concept of when facts were valid, when they were superseded, or how entities changed. Graphiti builds dynamic, temporally-aware knowledge graphs that track how facts and relationships evolve, supporting point-in-time queries, deliberate invalidation (not deletion) of outdated information, and full provenance from derived facts back to source episodes.

It is the open-source framework behind Zep's commercial Context Lake product.

---

## Core Abstractions

### Episodes
The fundamental unit of ingested data. Episodes can be messages, raw text, or structured JSON data. Every entity and relationship traces back to the episodes that produced it. This is the provenance anchor -- all derived knowledge maintains lineage to source episodes.

### Entities (Nodes)
People, products, policies, concepts extracted from episodes. Each entity carries:
- An evolving summary that updates as new information arrives
- Type classification (either prescribed via Pydantic models or emergent from data)
- Temporal metadata tracking when the entity was first seen and how it changed

### Facts/Relationships (Edges)
Triplets connecting entities with bi-temporal validity windows. Every edge carries four timestamps:
1. When the fact became valid in the real world
2. When the fact stopped being valid in the real world
3. When Graphiti learned about the fact
4. When Graphiti learned the fact was no longer true

### Community Nodes
NEEDS VERIFICATION: Community detection nodes that group related entities. Referenced in the codebase but documentation on their exact semantics is sparse.

### Group IDs
NEEDS VERIFICATION: Mechanism for scoping graphs to specific conversations, users, or tenants. The `group_id` parameter appears in the API but detailed multi-tenancy documentation is limited.

---

## How Temporal Facts Differ from Conventional Vector Memory

This is the central insight of Graphiti. Conventional vector memory stores embedding vectors of text chunks. It can answer "what text is similar to this query?" but cannot answer:

- "What was the customer's status as of last Tuesday?"
- "When did this policy change, and what was the previous version?"
- "Which facts have been superseded since the last interaction?"

Temporal facts maintain validity windows. When new information contradicts existing facts, Graphiti does not delete the old fact -- it **invalidates** it by setting the "valid_to" timestamp while preserving the full historical record. This enables:

- **Point-in-time queries** -- reconstruct the knowledge state at any historical moment
- **Change detection** -- identify what changed between two points in time
- **Deliberate forgetting** -- edge invalidation provides a controlled forgetting mechanism (benchmarked on FORGETEVAL-Adv)
- **Audit trails** -- complete history of what was known, when it was known, and when it was superseded

---

## Hybrid Search Architecture

Graphiti combines three retrieval mechanisms in a single ranked result set with no LLM-in-the-loop reranking:

1. **Semantic embeddings** -- vector similarity search for conceptual matching
2. **Keyword matching (BM25)** -- full-text search for precise term matching
3. **Graph traversal** -- follow explicit relationship paths through the knowledge graph

This avoids the latency and cost of LLM-based reranking while providing comprehensive retrieval across different query types.

---

## Ontology Support (Prescribed + Learned)

Graphiti combines two approaches to schema:
- **Prescribed ontology** -- developer defines entity and relationship types via Pydantic models before ingestion. This constrains extraction to domain-specific types
- **Learned ontology** -- entity and relationship types emerge from data during LLM extraction. This allows flexible evolution without upfront schema work

This dual approach means you can start unstructured and progressively add schema constraints as the domain model solidifies.

---

## Storage Backends

**Supported Graph Databases:**
- Neo4j 5.26+ (primary, most documented)
- FalkorDB 1.1.2+
- Kuzu 0.11.2 (deprecated)
- Amazon Neptune Database with OpenSearch Serverless

**LLM Support:**
- OpenAI (default)
- Anthropic, Groq, Google Gemini
- OpenAI-compatible APIs (DeepSeek, Together, local servers)

---

## MCP Server

Built-in Model Context Protocol server providing:
- Episodic management (add, retrieve episodes)
- Entity handling (search, inspect entities)
- Semantic search across the knowledge graph
- Graph operations (traversal, relationship inspection)

Connects directly to Claude, Cursor, and compatible MCP clients, providing "graph-backed memory without changing your workflow."

---

## API and Integration

**REST API Service:** FastAPI-based interface for programmatic access.

**LangGraph Integration:** Graphiti is designed for agent memory use cases and integrates with LangGraph for stateful agent workflows. NEEDS VERIFICATION: depth of LangGraph integration beyond basic memory store.

**Python SDK:** `graphiti-core` package on PyPI. Primary API is through the `Graphiti` class with methods like `add_episode()`, `search()`, `get_entity()`.

---

## Information Flow

```
Raw Data (messages, text, JSON)
    |
add_episode() call
    |
LLM extracts entities + relationships
    |
Temporal metadata attached (valid_from, valid_to, created_at, invalidated_at)
    |
Conflict detection against existing graph
    |
New facts materialized OR existing facts invalidated
    |
Neo4j / FalkorDB / Neptune
    |
Hybrid search (vector + BM25 + graph traversal)
    |
Ranked results returned (no LLM reranking)
```

---

## Comparison: Graphiti vs. GraphRAG (Microsoft)

| Dimension | Graphiti | Microsoft GraphRAG |
|-----------|---------|-------------------|
| Updates | Incremental (per episode) | Batch recomputation |
| Temporal awareness | Bi-temporal validity windows | None |
| Invalidation | Old facts preserved, marked invalid | No invalidation concept |
| Search | Hybrid (vector + BM25 + graph) | Community summaries |
| LLM in retrieval | Not required | Required for summarization |
| Real-time | Yes, per-episode updates | No, batch processing |

---

## Multi-Tenancy and Authorization

NEEDS VERIFICATION: `group_id` parameter provides logical scoping but full multi-tenant isolation (separate databases, access control, tenant-aware queries) is not extensively documented. The commercial Zep platform likely provides this, with Graphiti being the open-source core.

---

## Scaling Considerations

- Neo4j scales through clustering and sharding
- FalkorDB provides in-memory performance for smaller graphs
- Neptune provides managed scaling on AWS
- Per-episode incremental updates avoid batch recomputation bottlenecks
- NEEDS VERIFICATION: published benchmarks on graph sizes, query latency, and throughput in production

---

## Evaluation

Benchmarked on the full 385-case FORGETEVAL-Adv suite for deliberate forgetting. Edge invalidation provides a controlled forgetting mechanism that was tested against this benchmark.

---

## Trade-offs

**Strengths:**
- Most mature temporal knowledge graph for agent memory (20k+ stars)
- Bi-temporal tracking is genuinely novel and useful for evolving domains
- Hybrid search without LLM reranking reduces latency and cost
- Incremental updates without batch recomputation
- MCP server for direct AI assistant integration
- Prescribed + learned ontology flexibility

**Weaknesses:**
- Neo4j dependency for primary use case (though FalkorDB and Neptune are alternatives)
- LLM required for entity/relationship extraction during ingestion
- Multi-tenancy is limited in the open-source version
- No decision object model (tracks facts, not decisions)
- Provenance is episode-level, not W3C PROV-O standard

---

## What to Adopt vs. Build

**Adopt directly:**
- Bi-temporal fact model with invalidation (not deletion)
- Hybrid search architecture (vector + BM25 + graph traversal, no LLM reranking)
- Episode-based ingestion with provenance anchoring

**Use as inspiration:**
- Prescribed + learned ontology dual approach
- Incremental graph construction without batch recomputation
- Edge invalidation as deliberate forgetting mechanism

**Build custom:**
- W3C PROV-O provenance (Graphiti uses its own provenance model)
- Decision intelligence layer (not part of Graphiti)
- Multi-tenant isolation beyond group_id scoping
- Integration with broader ontology governance (SHACL, OWL)

---

## Key Questions Answered

1. **How do temporal facts differ from conventional vector memory?** They carry bi-temporal validity windows (when true in real world, when learned by system) and support invalidation, point-in-time queries, and change detection -- capabilities absent from vector stores.
2. **Is the hybrid search effective without LLM reranking?** Yes -- combining vector similarity, BM25, and graph traversal produces ranked results without the latency and cost of LLM-in-the-loop reranking.
3. **Can you start without an ontology?** Yes -- the "learned" ontology approach lets types emerge from data. You can add prescribed Pydantic models later as the domain model solidifies.

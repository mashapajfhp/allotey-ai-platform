# Semantica (semantica-agi/semantica)

**Category:** Ontology / Context
**Repository:** https://github.com/semantica-agi/semantica
**License:** MIT
**Language:** Python 3.8+
**Status:** RESEARCH COMPLETE
**Last Verified:** 2026-08-13

---

## What Problem Does It Solve?

Semantica addresses the gap between stateless LLM inference and accountable AI decision-making. Standard RAG pipelines retrieve similar text chunks but lose structure, provenance, and temporal context. Decisions made by agents are untracked log lines, not queryable objects. Semantica provides a deterministic infrastructure layer that sits beneath LLMs and agent frameworks, adding context graphs, decision records, causal reasoning, provenance, ontology governance, conflict detection, and audit trails on top of existing stacks.

The core thesis: AI systems need structured, queryable memory (not just embeddings), first-class decision objects (not just outputs), and W3C-standard provenance (not just logs).

---

## Architectural Abstractions

### Context Graphs
Context Graphs replace flat vector embeddings with structured, queryable memory. Instead of answering "what is similar?", they answer "what is connected, why, and how?" Nodes are typed entities (Person, Organization, Contract) with properties. Edges are typed, weighted relationships with metadata including edge_type and temporal fields. The graph supports bi-temporal tracking with point-in-time snapshots via `state_at(date)`.

### Decision Objects
Decisions are first-class graph objects, not log lines. Each decision stores category, scenario, reasoning, outcome, and confidence. The API supports:
- `record_decision()` -- stores the full decision context
- `add_causal_relationship()` -- links decisions via CAUSED, INFLUENCED, or PRECEDENT_FOR
- `trace_decision_chain()` -- full causal ancestry traversal
- `find_similar_decisions()` -- semantic precedent search
- `analyze_decision_impact()` -- downstream influence mapping
- `check_decision_rules()` -- policy compliance gating

### AgentContext Abstraction
High-level memory API combining vector store and knowledge graph. Provides `store()` and `retrieve()` methods for conversation management. This is the primary integration point for agent frameworks.

---

## Major Components

### Knowledge Pipeline
Sources flow through: Ingest -> Parse -> Normalize -> Split -> Extract -> Conflict Detection -> Deduplication -> Knowledge Graph -> Enriched KG -> Vector Store + Polyglot Graph Store. Each stage is independently importable. The pipeline includes NER, relation extraction, event extraction, and GraphRAG-native entity-aware chunking.

### Reasoning Engine (No LLM Required)
Deterministic reasoning that requires no LLM calls:
- **Forward chaining and Rete networks** -- rule-based inference
- **Datalog** -- logic programming queries
- **SPARQL** -- triple store querying
- Every inference path is fully traceable

### Ontology Governance
- **SHACL constraints** -- enforce schema validity on graph data
- **OWL generation** -- formal ontologies from graphs
- **SKOS vocabulary management** -- controlled taxonomies with visual editor
- Ontology hub for centralized governance

### Conflict Detection and Entity Resolution
Contradictory facts are flagged before merge (vs. silent overwrite in standard RAG). Blocking + semantic deduplication with provenance-preserving merges.

---

## Information Flow

```
Multi-Source Ingestion (files, web, Kafka, Kinesis, Git, email, MCP)
    |
Knowledge Pipeline (parse, normalize, split, extract)
    |
Conflict Detection + Deduplication
    |
Knowledge Graph (nodes + edges + provenance)
    |
[Ontology Governance] [Reasoning Engine] [Decision Intelligence]
    |
Enriched KG -> Vector Store + Polyglot Graph Store
    |
Query Layer (SPARQL, Cypher, semantic search, graph traversal)
```

---

## Structured vs. Unstructured Data Handling

Semantica handles both. Unstructured data enters through the knowledge pipeline (NER, relation extraction, event extraction). Structured data integrates through enterprise connectors (Databricks Unity Catalog + Delta Lake, Snowflake warehouses). Tables become graph nodes with provenance -- no export/import hop required.

---

## Business Meaning Modeling

Business meaning is captured through the ontology layer (OWL/SHACL/SKOS) which defines types, constraints, and vocabulary. Entity types and relationship types map to domain concepts. The SKOS vocabulary management ensures controlled taxonomies for consistent business terminology.

---

## Entity/Relationship Representation

```python
graph.add_node("entity_id", "Type", property=value)
graph.add_edge("source", "target", edge_type="relationship", metadata=...)
neighbors = graph.get_neighbors("node_id", hops=2)  # BFS traversal
snapshot = graph.state_at("2024-01-01")  # historical state
```

Entities are typed nodes. Relationships are typed, weighted edges with metadata. Full W3C PROV-O lineage on every node. Bi-temporal support tracks facts across time.

---

## Storage Architecture (Polyglot by Design)

**RDF Triple Stores (W3C standards):**
- Embedded Oxigraph (default)
- Blazegraph, Apache Jena, Eclipse RDF4J (SPARQL endpoints)

**Labeled Property Graphs:**
- Neo4j, FalkorDB, Apache AGE, AWS Neptune (Cypher queries)

**Vector stores:** FAISS (embedded) and others

All backends are swappable without code changes.

---

## MCP Support

Full-featured Model Context Protocol server integration. MCP is listed as both an ingestion source and an access layer. The Claude plugin integration is documented in `plugins/.claude-plugin/README.md`.

---

## Agent Framework Integrations

- Native Agno integration
- LangGraph, CrewAI, LlamaIndex plugins (via cookbook/examples)
- Framework-agnostic: keeps your LLM, vector store, and agent framework unchanged

---

## Provenance and Auditability

W3C PROV-O provenance on every fact. Audit trails exportable to JSON, CSV, or RDF. Decision objects carry full reasoning chains, confidence scores, and causal links. Suitable for regulator submission.

---

## Observability and Evaluation

- Graph analytics: centrality, community detection, link prediction, shortest-path queries
- Decision insights: aggregated analytics across decision objects
- `semantica doctor` CLI for health checks
- NEEDS VERIFICATION: specific observability/metrics integration (Prometheus, OpenTelemetry)

---

## Multi-Tenancy and Authorization

NEEDS VERIFICATION: Multi-tenancy isolation patterns are not documented in the README or core docs. The polyglot storage layer could support tenant isolation at the graph store level, but this is not explicitly addressed.

---

## Scaling Considerations

NEEDS VERIFICATION: No published scaling benchmarks (node/edge counts, query latency at scale). The polyglot architecture suggests horizontal scaling through backend choice (e.g., Neo4j clustering, cloud graph databases), but production scaling guidance is absent.

---

## Trade-offs and Lessons

| Dimension | Semantica | Vector DB + RAG | LLM Memory |
|-----------|-----------|-----------------|-----------|
| Recall | Graph traversal + semantic search | Embedding similarity | Token window |
| Decisions | First-class queryable | Not stored | Not stored |
| Provenance | W3C PROV-O | None | None |
| Conflicts | Detected and resolved | Silent overwrite | Silent overwrite |
| Time travel | Point-in-time snapshots | No | No |

**Key trade-off:** Semantica adds complexity (ontology definition, SHACL constraints, graph maintenance) in exchange for accountability and explainability. For simple retrieval, standard RAG is simpler. For regulated, auditable AI decisions, Semantica provides infrastructure that is otherwise custom-built.

---

## What to Adopt vs. Build

**Adopt directly:**
- Decision object model (first-class decisions with causal links)
- W3C PROV-O provenance approach
- Conflict detection before merge (vs. silent overwrite)
- Bi-temporal graph state management

**Use as inspiration:**
- Context graph abstraction pattern (structured memory over flat embeddings)
- Deterministic reasoning engine (forward chaining, Rete, Datalog)
- Polyglot storage with swappable backends

**Build custom:**
- Multi-tenant isolation (not addressed in Semantica)
- Production scaling and monitoring
- Domain-specific ontology definitions
- Integration with specific authorization systems

---

## Key Questions Answered

1. **How do context graphs differ from standard RAG?** They answer "what is connected, why, and how?" vs. "what is similar?" -- structure, provenance, and causal links vs. embedding similarity.
2. **What makes decision objects valuable?** Traceability, precedent search, impact analysis, compliance gating -- decisions become queryable data, not lost outputs.
3. **Is the reasoning engine useful without an LLM?** Yes -- forward chaining, Rete networks, Datalog, and SPARQL operate deterministically with full explainability.

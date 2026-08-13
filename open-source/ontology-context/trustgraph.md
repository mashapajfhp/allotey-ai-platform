# TrustGraph (trustgraph-ai/trustgraph)

**Category:** Ontology / Context
**Repository:** https://github.com/trustgraph-ai/trustgraph
**License:** Apache 2.0
**Language:** Python, TypeScript
**Status:** RESEARCH COMPLETE
**Last Verified:** 2026-08-13

---

## What Problem Does It Solve?

TrustGraph solves the problem of grounding LLM applications in structured, verifiable knowledge. Standard RAG pipelines retrieve text chunks without understanding their relationships, types, or provenance. TrustGraph provides a complete context engineering platform that combines data streaming, knowledge graph construction, vector search, and LLM orchestration into a containerized system designed to reduce hallucinations and provide traceable reasoning paths.

The core differentiator is the "holonic" approach: knowledge is packaged as self-contained, composable units (holons) that carry their own context and provenance, then assembled dynamically into context graphs for query answering.

---

## Architectural Abstractions

### Holonic Context Graphs (Three-Layer Architecture)

The context graph architecture is defined by three layers built on a base knowledge graph:

1. **Ontological Grounding Layer** -- establishes the semantic vocabulary and type system using OWL/SKOS/SHACL standards
2. **AI-Optimized Retrieval Layer** -- vector embeddings and graph traversal for efficient retrieval
3. **Agentic Behavior Reification Layer** -- records and reasons about agent actions

A holon is a modular, independent whole that naturally integrates into a larger domain-wide intelligence layer. Facts are complete units that relate to domain contexts, which themselves relate to organizational knowledge. This mirrors Arthur Koestler's concept: "a holon is simultaneously a whole in itself and a part of something larger."

### Context Cores

The deployable unit of knowledge. A Context Core packages everything an agent needs to reason reliably over a domain into a single, portable artifact containing:
- **Ontology** -- domain schema and entity mappings (RDF/OWL/SKOS/SHACL compatible)
- **Holons** -- entities, relationships, and supporting evidence
- **Embeddings** -- vector indexes for semantic retrieval
- **Provenance** -- complete traceability of fact origins, ingestion time, extraction methods
- **Retrieval Policies** -- traversal rules, freshness controls, authority ranking

---

## Major Components

### Three RAG Implementations
1. **DocumentRAG** -- traditional text-chunk retrieval with vector search
2. **GraphRAG** -- traverses explicit relationship paths through structured graphs
3. **OntologyRAG** -- leverages domain schemas for precision retrieval. This is TrustGraph's original contribution: combining formal ontology definitions (OWL schemas) with LLM-based extraction to enforce conformance to predefined types, properties, and relationships

### Ontology Workbench
Interactive schema management with OWL/XML and Turtle import/export. Includes circular dependency detection. SHACL validation catches violations before they corrupt the knowledge graph.

### Agent Console
Query interface with streaming responses and live explainability event tracking. The GraphRAG View provides visual explainability DAGs with inline provenance.

### 3D Context Explorer
Interactive graph visualization with dynamic loading and edge animations for exploring knowledge graph structure.

---

## Information Flow

```
Raw Documents / Data Sources
    |
Ingestion Pipeline
    |
LLM-Guided Extraction (constrained by Ontology)
    |
Facts packaged as Holons (RDF 1.2 triples + provenance + confidence)
    |
Holons integrated into Global RDF Graph
    |
[Cassandra] [Qdrant] [Garage S3-compatible]
    |
Query -> Context Graph assembly (dynamic subgraph) -> LLM grounded response
```

### Agent Querying Flow
1. User query enters agent console
2. Semantic similarity OR ontology-guided retrieval identifies entry points
3. Graph traversal extracts neighborhood via BFS
4. LLM grounds reasoning in retrieved subgraph
5. System tracks reasoning path with explicit provenance -- "answers with receipts"

---

## Multi-Tenancy (Three-Layer Isolation)

TrustGraph has explicit multi-tenancy built into its architecture:

- **Workspace** -- fully isolated tenancy with independent data, users, config, pipelines. Enforced at queue, storage, and API gateway layers
- **Collection** -- groups related holons within a workspace by domain/project/customer
- **Flow** -- running data pipelines for ingestion, extraction, structuring, storage

This is one of the more mature multi-tenancy models among the ontology/context projects.

---

## Storage and Infrastructure

### Database Backends (Multi-Model)
- **Cassandra** -- managed tabular/relational/key-value/document/graph storage
- **Qdrant** -- vector embedding storage
- **Garage** -- S3-compatible object/file storage (open source alternative to S3)
- **Pulsar or RabbitMQ** -- high-speed pub/sub messaging fabric

### LLM Support
**Cloud APIs:** Anthropic, Cohere, Gemini, Mistral, OpenAI
**Local Inference:** vLLM, Ollama, TGI, LM Studio, Llamafiles
**Verified Cloud Deployments:** Alibaba Cloud, AWS, Azure, GCP, OVHcloud, Scaleway

Key philosophy: "TrustGraph relies on absolutely no 3rd party services aside from optional API integrations to cloud-hosted LLMs." Sovereignty-first with bundled inferencing stacks.

---

## Ontology and Semantic Standards

- **OWL** -- defines classes, properties, and hierarchical relationships. Gives LLMs a strict blueprint for entity and edge extraction
- **SKOS** -- organizes controlled vocabularies and taxonomies. Ensures synonym recognition (e.g., "AI" = "Artificial Intelligence")
- **SHACL** -- validates extracted data through constraint shapes before graph integration
- **RDF 1.2 (RDF-star)** -- enables statements about statements through graph reification. Preserves provenance and source attribution for each fact

---

## Provenance and Explainability

Each graph traversal is logged with:
- Which entities/relationships were retrieved
- Complete fact-level provenance (source document, ingestion timestamp, extraction method)
- Explicit connection reasoning between nodes
- Confidence scores per holon

This enables verifiable outputs showing exactly why conclusions were reached.

---

## MCP Support

Model Context Protocol integration is available. The monorepo includes an MCP package for external tool connectivity.

---

## API and Client Libraries

- **REST API** -- gateway with user-configurable API keys
- **TypeScript Libraries:**
  - `@trustgraph/client` (core API)
  - `@trustgraph/react-state` (state management)
  - `@trustgraph/react-provider` (React integration)
- **Streaming** -- response streaming with live explainability event tracking

---

## Deployment

- **Local:** Docker/Podman with docker-compose
- **Orchestration:** Kubernetes with resource manifests
- **Configuration:** CLI-driven setup via `npx @trustgraph/config` or browser-based Configuration Terminal
- **Output:** Deployment bundles with INSTALLATION.md instructions

---

## UI Components

The included web interface (port 8888) provides:
- Agent Console with streaming and explainability tracking
- GraphRAG View with visual explainability DAGs
- 3D Context Explorer with dynamic loading
- Document Ingestion with chunk inspection
- Ontology Workbench (OWL/XML, Turtle import/export)
- Schema Workbench for interactive schema management
- Prompt Editor for configuration

---

## Scaling Considerations

The multi-model storage architecture (Cassandra, Qdrant, Garage) each scale independently. Pulsar/RabbitMQ provides the streaming backbone for high-throughput ingestion. Kubernetes deployment supports horizontal scaling. NEEDS VERIFICATION: published benchmarks on throughput, latency, and graph sizes in production.

---

## Trade-offs

**Strengths:**
- Most complete infrastructure stack among ontology/context projects (storage, streaming, LLM, UI, API)
- Explicit multi-tenancy model (Workspace/Collection/Flow)
- Three RAG implementations with OntologyRAG as original contribution
- Sovereignty-first design (no mandatory third-party dependencies)
- Strong W3C standards compliance (OWL, SKOS, SHACL, RDF 1.2)

**Weaknesses:**
- Heavy infrastructure footprint (Cassandra + Qdrant + Garage + Pulsar/RabbitMQ)
- Complexity of deployment and operations for smaller teams
- OntologyRAG requires upfront ontology definition work
- Decision intelligence is less developed than Semantica's model

---

## What to Adopt vs. Build

**Adopt directly:**
- OntologyRAG methodology (schema-guided LLM extraction)
- Holonic context model (self-contained knowledge units with embedded provenance)
- Multi-tenancy architecture pattern (Workspace/Collection/Flow)

**Use as inspiration:**
- Three-layer context graph architecture (ontological + retrieval + agentic)
- Context Core as deployable knowledge artifact
- W3C standards integration approach

**Build custom:**
- Decision object model (TrustGraph does not have first-class decision tracking)
- Domain-specific ontologies
- Lighter infrastructure alternatives to the full Cassandra/Qdrant/Pulsar stack

---

## Key Questions Answered

1. **What are holonic context graphs?** Self-contained knowledge units (holons) that carry their own context, provenance, and confidence, and compose into larger domain intelligence layers.
2. **How does OntologyRAG differ from GraphRAG?** OntologyRAG enforces conformance to predefined types and relationships using formal OWL schemas, producing highly structured knowledge graphs. GraphRAG is schema-free.
3. **Is multi-tenancy production-ready?** The three-layer model (Workspace/Collection/Flow) is architecturally mature, with isolation enforced at queue, storage, and API gateway layers.

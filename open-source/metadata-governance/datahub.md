# DataHub (datahub-project/datahub)

**Category:** Metadata / Governance
**Repository:** https://github.com/datahub-project/datahub
**License:** Apache 2.0
**Language:** Java (backend), Python (ingestion/SDK), TypeScript (frontend)
**Stars:** 11,600+
**Status:** RESEARCH COMPLETE
**Last Verified:** 2026-08-13

---

## What Problem Does It Solve?

DataHub solves the problem of fragmented metadata across the modern data stack. When organizations use dozens of data tools (warehouses, BI platforms, pipelines, ML systems), metadata about those assets -- ownership, lineage, quality, business terms, access policies -- is scattered and inconsistent. DataHub creates a unified metadata graph that connects all data assets through real-time streaming or batch ingestion, enabling discovery, governance, observability, and AI-grounded context.

Originally built at LinkedIn to handle hyperscale metadata challenges, DataHub now serves as "the context platform for your data and AI stack."

---

## Architectural Abstractions

### Streaming-First, API-First Architecture
DataHub's core differentiator is its stream-based metadata architecture built on Kafka. Metadata changes are communicated and reflected within seconds, and downstream systems can subscribe to metadata change events for real-time metadata-driven applications.

### Metadata Graph
A graph-structured model where data assets (tables, dashboards, pipelines, ML models) are nodes and their relationships (lineage, ownership, containment, association) are edges. The graph supports:
- Column-level lineage tracing data flow from source to consumption
- Upstream/downstream dependency tracking
- Impact analysis for change management

### Federated Metadata Services
Multiple metadata services can be owned and operated by different teams, communicating through Kafka while maintaining global search capabilities. This design supports data mesh implementations where teams maintain their own metadata while contributing to a unified catalog.

---

## Major Components

### Metadata Service (GMS)
The core service managing the metadata graph. Handles:
- Metadata aspect storage and retrieval
- Relationship management
- Event emission to Kafka
- GraphQL and REST API exposure

### Search Service
Elasticsearch-powered search across the entire data ecosystem. Supports:
- Universal search across all asset types
- Semantic matching for business term queries
- Faceted navigation by domain, owner, tag, type

### Graph Service
Manages relationship traversal for lineage, impact analysis, and dependency tracking.

### Ingestion Framework
80+ production-grade connectors extracting:
- Schema metadata
- Column-level lineage
- Usage statistics
- Data profiling
- Quality metrics

Supports both push (SDK, API) and pull (scheduled ingestion) patterns.

---

## Information Flow

```
Data Sources (Warehouses, BI, Pipelines, ML, APIs)
    |
80+ Connectors (push or pull ingestion)
    |
Kafka (streaming metadata events)
    |
Metadata Service (GMS)
    |-- Graph Service (relationships, lineage)
    |-- Search Service (Elasticsearch indexing)
    |-- Storage (MySQL for aspects)
    |
GraphQL / REST / Python SDK / MCP
    |
Consumers: UI, AI Agents, BI Tools, Custom Apps
```

---

## Governance and Organization

### Domains
Organizational units grouping related datasets. Supports data mesh where domain teams own their data products.

### Business Glossary
Standardized terminology linking business concepts to technical assets. Enables non-technical users to find data using business language.

### Tags and Terms
Classification system for PII identification, sensitivity levels, compliance requirements. Tags drive policy enforcement.

### Ownership
Team and individual tracking with role-based responsibility (data steward, data owner, technical owner).

### Policies
Access control and compliance rules applied at the metadata level. NEEDS VERIFICATION: how policies translate to actual data access enforcement (metadata-level vs. query-level).

---

## Quality and Observability

### Data Profiling
Column-level statistics: null counts, uniqueness, value distributions, row counts.

### Quality Metrics
Test results, freshness signals, custom quality checks. Integration with external quality tools.

### Usage Statistics
Query frequency, user tracking, popularity metrics informing data asset discovery.

### Audit Trails
Complete history of metadata changes for regulatory compliance.

---

## AI and Agent Integration

### MCP Server (Model Context Protocol)
Direct integration with Cursor, Claude Desktop, and Cline. AI agents can:
- Search the metadata catalog
- Inspect lineage and relationships
- Access data quality signals
- Understand ownership and governance context

### Analytics Agent
Natural language data queries returning SQL, results, and visualizations. Enables non-technical users to explore data through conversation.

### Context Platform (2026)
DataHub Cloud v1 launched as a "context platform" for analytics agents (May 2026). The thesis: agents reasoning over enterprise data need a context graph to work from, and that graph needs to be maintained as shared data management infrastructure.

Components:
- **Context Documents** -- structured context provided to agents
- **Agent Context Kit** -- tools for building agent-aware applications
- NEEDS VERIFICATION: details of Context Documents format and Agent Context Kit API

---

## Data Products

Data products are first-class entities with:
- Hard requirement to belong to a Domain
- Input and output dataset associations
- Producer-consumer relationship tracking
- Lifecycle state management
- Quality and SLA commitments

Aligns with data mesh principles where every data product has a clear organizational owner.

---

## Storage Infrastructure

- **Elasticsearch** -- search indexing and faceted navigation
- **MySQL** -- relational storage for metadata aspects
- **Kafka** -- event streaming for real-time metadata updates
- **Docker** -- containerized deployment
- **Kubernetes** -- production deployment with Helm charts

---

## APIs and Developer Experience

- **GraphQL API** -- flexible metadata querying
- **REST/OpenAPI endpoints** -- programmatic integration
- **Python SDK** -- full-featured metadata ingestion and retrieval
- **Java SDK** -- backend integration
- **CLI tools** -- command-line operations
- **MCP Server** -- AI agent integration

---

## Multi-Tenancy

NEEDS VERIFICATION: DataHub's multi-tenancy model. The federated metadata service design supports team-level ownership, and Domains provide organizational isolation, but dedicated tenant-level isolation (separate databases, access control boundaries) is not explicitly documented in the open-source version. DataHub Cloud likely provides this.

---

## Deployment Options

1. **Managed SaaS** (DataHub Cloud) -- SLA-backed, fully managed
2. **Self-hosted Docker** -- development and small teams
3. **Kubernetes** -- recommended for production (Helm charts available)

---

## Scaling

Production-proven at hyperscale: 10M+ assets and billions of relationships at LinkedIn. The streaming architecture (Kafka) enables real-time metadata updates at high throughput. Elasticsearch handles search at scale.

---

## Trade-offs

**Strengths:**
- Most active open-source data catalog community (11,600+ stars, 3-year head start on competitors)
- Streaming-first architecture for real-time metadata updates
- 80+ production-grade connectors
- Column-level lineage (not just table-level)
- Evolving toward "context platform" for AI agents
- Federated metadata services for data mesh
- LinkedIn production pedigree (10M+ assets)

**Weaknesses:**
- Heavy infrastructure requirements (Kafka + Elasticsearch + MySQL + GMS)
- Primarily a metadata catalog, not an ontology engine or reasoning system
- No built-in semantic layer for metrics (complements Cube, not replaces it)
- No knowledge graph construction from unstructured data (unlike Semantica/TrustGraph)
- Context platform features concentrated in commercial DataHub Cloud

---

## Could DataHub Become Part of the Intelligence Platform's Control Plane?

### Yes, as a metadata and context backbone
DataHub's metadata graph provides exactly the kind of "what data exists, who owns it, where it came from, and how good it is" context that AI agents need. As a control plane component:

- **Asset Discovery** -- agents query DataHub to find relevant datasets
- **Lineage for Impact Analysis** -- before modifying data, agents understand downstream dependencies
- **Quality Gating** -- agents check data quality signals before using datasets
- **Governance Context** -- agents understand access policies and ownership before accessing data
- **Business Glossary** -- agents translate between business terms and technical schemas

### Limitations for control plane
DataHub does not provide:
- Knowledge graph construction from unstructured data (need Semantica/TrustGraph)
- Temporal fact tracking and invalidation (need Graphiti)
- Semantic layer for metrics (need Cube)
- Decision intelligence and causal reasoning (need Semantica)
- Agent orchestration or workflow execution

### Recommended pattern
Use DataHub as the **metadata context layer** that feeds the broader intelligence platform. Agents consult DataHub for "what data is available and trustworthy" before executing domain-specific reasoning through other components.

---

## What to Adopt vs. Build

**Adopt directly:**
- Metadata graph for data asset discovery and lineage
- 80+ connectors for data ecosystem integration
- Business glossary and domain organization
- MCP server for agent access to metadata context

**Use as inspiration:**
- Streaming-first metadata architecture (Kafka-based event-driven updates)
- Federated metadata services pattern (team-owned, globally searchable)
- Context platform concept (metadata as AI agent context)

**Build custom:**
- Knowledge graph from unstructured data
- Temporal fact management
- Decision intelligence
- Integration between DataHub metadata and domain-specific ontologies

---

## Key Questions Answered

1. **Could a metadata layer become part of the control plane?** Yes -- DataHub provides the "what data exists and is trustworthy" context that AI agents need. But it is one component, not the entire control plane.
2. **How does DataHub relate to a semantic layer like Cube?** Complementary. DataHub catalogs metadata about data assets. Cube defines how to query those assets with governed metrics. DataHub tells you what exists; Cube tells you what it means.
3. **Is the streaming architecture justified?** For real-time metadata updates in a large organization, yes. For smaller deployments, the Kafka dependency adds operational overhead.

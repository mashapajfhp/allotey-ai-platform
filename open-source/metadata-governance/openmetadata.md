# OpenMetadata (open-metadata/OpenMetadata)

**Category:** Metadata / Governance
**Repository:** https://github.com/open-metadata/OpenMetadata
**License:** Apache 2.0
**Language:** Java (backend), Python (SDK/ingestion), TypeScript (frontend)
**Status:** NOT STARTED -- Key Questions Listed Below
**Last Verified:** 2026-08-13

---

## Preliminary Overview

OpenMetadata is an open platform for trusted data context, organizational memory, and business semantics. Built by the founders of Apache Hadoop, Apache Atlas, and Uber Databook, it positions itself as "the Open Context Layer for AI." Unlike DataHub's streaming-first metadata catalog approach, OpenMetadata emphasizes a broader scope: connecting technical metadata, business semantics, data quality, lineage, ownership, and organizational memory into a unified knowledge graph.

Version 1.13 was released June 2026 with significant AI and MCP enhancements.

---

## What Is Known

### Architecture (Six Primary Functions)
1. **Collection** -- 130+ connectors, APIs, events, SDKs for metadata ingestion
2. **Normalization** -- open schemas and standards for consistent metadata
3. **Connection** -- technical and semantic relationship mapping
4. **Memory Preservation** -- conversations and decisions become reusable insights
5. **Governance** -- policies, stewardship, and compliance
6. **Activation** -- APIs, semantic search, MCP interfaces

### Knowledge Graph
Stores interconnected relationships between:
- Assets and columns
- Classifications (PII, sensitive data)
- Glossary terms and business concepts
- Ownership mappings
- Data product associations
- Lineage flows (table and column level)
- Test validations
- Policy applications
- Data contract bindings
- Memory nuggets (organizational knowledge)

### Metadata Coverage
**Technical:** databases, schemas, tables, columns, APIs, dashboards, pipelines, ML models, storage, data types, sample queries, usage patterns
**Quality:** test results, freshness, null checks, uniqueness, distribution analysis, incidents, alerts
**Lineage:** table lineage, column lineage, dashboard dependencies, pipeline flows, metric calculations, ML model inputs, API dependencies
**Governance:** owners, stewards, teams, roles, certifications, lifecycle states, review workflows
**Semantics:** glossaries, business terms, synonyms, metrics, KPIs, classifications, tags, domains, ontologies

### Data Products
Aligned with DCAT/DPROD standards. Data products encapsulate input datasets, output datasets, domain context, producer-consumer relationships, lifecycle states, purposes, and associated policies.

### Memory System
Unique differentiator: memories preserve tribal knowledge as governed entities attachable to assets, users, teams, threads, and workflows. Memories capture:
- Conversational context and decisions
- Assumptions and analytical rationale
- Incident learnings and remediation
- Domain expert explanations
- AI agent discoveries

These become searchable, reusable organizational assets accessible to both humans and AI.

### MCP Server
AI assistants and LLMs can:
- Execute semantic search queries
- Retrieve entity details and relationships
- Inspect lineage and impact analysis
- Access data contracts and governance context
- Store and retrieve memory nuggets
- Update metadata and create lineage
- List and create data quality tests
- Analyze root causes of quality failures

### AI SDK
`data-ai-sdk` package (Python, TypeScript, Java):
- Convert MCP tools to LangChain-compatible formats
- Call metadata tools directly from applications
- Build custom AI workflows with governed context
- Preserve organizational memory programmatically

### Open Standards Alignment
- DCAT/DPROD -- data catalog and product semantics
- PROV-O -- W3C provenance and lineage
- OpenLineage -- standardized lineage events
- ODCS 3.1 -- data contract standards with SLAs
- RDF/OWL -- semantic web and linked data
- JSON-LD -- semantic interoperability
- SHACL -- graph validation

### Semantic Search
Finds assets by business meaning rather than exact keyword matches. Queries like "find trusted customer datasets with quality issues" leverage the connected graph.

---

## Comparison to DataHub

| Dimension | OpenMetadata | DataHub |
|-----------|-------------|---------|
| Architecture | Schema-first knowledge graph | Streaming-first (Kafka) metadata graph |
| Founded by | Apache Hadoop/Atlas/Uber Databook founders | LinkedIn engineering |
| Memory system | Built-in organizational memory | No equivalent |
| AI SDK | Dedicated data-ai-sdk package | MCP server + Analytics Agent |
| Standards | DCAT, PROV-O, OpenLineage, ODCS, RDF/OWL, SHACL | Less standards-focused |
| Connectors | 130+ | 80+ |
| Stars | Growing (newer project) | 11,600+ (3-year head start) |
| Context layer | "Open Context Layer for AI" positioning | "Context Platform" (2026) |
| Streaming | Not streaming-first | Kafka-native streaming |
| Data products | DCAT/DPROD aligned | Domain-required products |
| Community size | Smaller but growing | Larger, more established |

**Key Differences:**
1. OpenMetadata has a built-in **memory system** -- DataHub does not
2. OpenMetadata provides a dedicated **AI SDK** for agent integration -- DataHub has MCP + Analytics Agent
3. OpenMetadata is more **standards-aligned** (PROV-O, DCAT, SHACL, RDF/OWL) -- DataHub is more pragmatic
4. DataHub has a **streaming-first** architecture -- OpenMetadata is not Kafka-native
5. Both now position as "context platforms" for AI agents

---

## Key Questions to Investigate

### Architecture and Abstractions
- [ ] What is the internal storage architecture (graph database, relational, hybrid)?
- [ ] How does the knowledge graph handle schema evolution and versioning?
- [ ] What is the query engine behind semantic search?
- [ ] How does the normalization layer work across 130+ connectors?

### Memory System
- [ ] How are memories structured internally (schema, relationships)?
- [ ] Can memories be versioned and tracked over time?
- [ ] How does memory retrieval work for AI agents (search, filtering, ranking)?
- [ ] What prevents memory conflicts when multiple agents write to the same context?

### AI and Agent Integration
- [ ] How mature is the MCP server implementation compared to DataHub's?
- [ ] What operations can agents perform through the AI SDK beyond metadata queries?
- [ ] Can agents create new metadata entities through the SDK?
- [ ] How does the LangChain integration work in practice?

### Standards Compliance
- [ ] How deeply are PROV-O, RDF/OWL, SHACL actually implemented?
- [ ] Can ontologies defined in OWL be imported and used for governance?
- [ ] Is the DCAT/DPROD alignment surface-level or deeply integrated?
- [ ] Does SHACL validation actually constrain metadata graph updates?

### Multi-Tenancy and Security
- [ ] How does OpenMetadata handle multi-tenant isolation?
- [ ] What authentication/authorization model is used?
- [ ] Can different tenants have different governance policies?
- [ ] How are memories scoped across tenants?

### Scaling and Performance
- [ ] What are the practical limits on metadata graph size?
- [ ] How does performance compare to DataHub at LinkedIn scale?
- [ ] Can OpenMetadata handle real-time metadata streaming (without Kafka)?

### Relevance to Intelligence Platform
- [ ] Is the memory system the key differentiator for AI agent use cases?
- [ ] Could OpenMetadata serve as both metadata catalog AND organizational memory?
- [ ] How does the AI SDK compare to building custom MCP integrations?
- [ ] Is the standards alignment (PROV-O, OWL, SHACL) deep enough to replace dedicated ontology tools?

---

## Potential Relevance

OpenMetadata's strongest contributions are the **memory system** and the **AI SDK**. The memory system addresses a gap that DataHub and most metadata catalogs ignore: preserving the tribal knowledge, decisions, and rationale that surround data assets. For an intelligence platform, this is directly relevant -- AI agents need not just data metadata, but organizational context about why decisions were made, what assumptions hold, and what past incidents mean.

The AI SDK (`data-ai-sdk`) with LangChain compatibility and MCP server suggests OpenMetadata is actively building toward the "context layer for AI agents" vision that the intelligence platform shares.

However, the absence of streaming architecture (vs. DataHub's Kafka) may limit real-time metadata freshness. And the standards alignment (PROV-O, OWL, SHACL) needs verification -- if it is deep, OpenMetadata could potentially serve as both metadata catalog and lightweight ontology layer. If it is surface-level, dedicated ontology tools (Semantica, TrustGraph) remain necessary.

---

## License Consideration

Apache 2.0 is fully permissive. The commercial offering (Collate) adds enterprise features, but the core platform including MCP server and AI SDK is open source.

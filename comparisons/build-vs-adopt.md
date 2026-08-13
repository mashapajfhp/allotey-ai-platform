# Build vs. Adopt Analysis

> STATUS: DEEP REVIEW COMPLETE
> Last updated: 2026-08-13

## Core Constraint

**Open-source first. No paid dependencies for V1.** Every adopted component must carry a permissive license (MIT or Apache 2.0). MPL-2.0 is acceptable with discipline (file-level copyleft). SSPL, AGPL, BSL, and custom licenses are excluded from adoption — study only.

## Decision Framework

| Strategy | When to Use |
|----------|-------------|
| **Adopt** | Existing OSS solves the problem well; no significant modification needed |
| **Wrap** | OSS is useful but should sit behind our interfaces for flexibility |
| **Extend** | OSS solves part of the problem; needs additional capability |
| **Build** | Strategically important IP, or existing solutions are inadequate |

---

## V1 Technology Stack — Converged Decisions

The deep research phase converged on a dramatically simplified V1 architecture. The key insight: **PostgreSQL with extensions (Apache AGE for graphs, pgvector for vectors) can serve as a unified data layer**, eliminating the need for separate graph and vector databases in V1.

### V1 Infrastructure Footprint

| Service | Purpose | License | Notes |
|---------|---------|---------|-------|
| PostgreSQL | Transactional data, graph (AGE), vectors (pgvector) | PostgreSQL License | Single instance for V1 |
| Temporal | Durable workflows | MIT | Self-hosted |
| ClickHouse | Observability store (via Langfuse) | Apache 2.0 | Enters when Langfuse is adopted |
| DuckDB | Embedded analytics | MIT | In-process, zero server |

**Total new services for V1: 2** (PostgreSQL + Temporal). DuckDB is embedded. ClickHouse enters only when Langfuse demands it.

---

## Capability-Level Analysis

### Experience Layer
**Strategy: BUILD**
The experience layer is product-defining. No generic OSS UI framework captures the platform's unique value proposition.

### AI Gateway
**Strategy: BUILD (composing adopted components)**
No existing OSS project provides a complete AI gateway. Build by composing: LiteLLM (model routing) + OpenFGA (authorization) + custom logic (budget, governance, tenant isolation).

### Identity & Authorization
**Strategy: ADOPT OpenFGA + BUILD delegation layer**
- **OpenFGA** (Apache 2.0, CNCF Incubating): Sub-ms performance, contextual tuples, strong multi-tenancy via store-per-tenant. ADOPT.
- **Delegation layer**: User → Agent → Tool permission propagation (On-Behalf-Of pattern). No OSS solves this. BUILD.
- **SpiceDB**: Strong alternative but OpenFGA has better documentation and CNCF backing.
- **OPA**: Complementary for policy enforcement, not a ReBAC replacement.

### Model Gateway
**Strategy: WRAP LiteLLM**
- **LiteLLM** (MIT core): 100+ providers, proven proxy mode, cost tracking. Genuine MIT for all core features.
- **Key decision**: Use OpenFGA for authorization instead of LiteLLM's enterprise RBAC features. This keeps the stack fully open-source.
- Wrap with platform-specific routing, tenant isolation, and budget logic.

### Agent Runtime
**Strategy: WRAP Agno (primary) + LangGraph (secondary)**
- **Agno** (Apache 2.0): PRIMARY — richest feature set (teams, workflows, memory, knowledge, RBAC, tracing), PostgreSQL-native storage, multi-tenancy support.
- **LangGraph** (MIT): SECONDARY — largest community, most production deployments, best for complex state machine orchestration.
- **Google ADK** (Apache 2.0): Best A2A/MCP protocol support. Consider for V2 when A2A becomes relevant.
- **Strands / MS Agent Framework**: Too new. Monitor.
- Wrap the primary runtime with platform-specific tool/auth/observability integration.

### Agent Registry
**Strategy: BUILD**
No strong standalone OSS exists. Build as part of the control plane.

### Tool Registry
**Strategy: BUILD on MCP**
- **MCP** (MIT): ADOPT as tool interface standard on Day 1. Target 2025-06-18 spec version.
- BUILD the governance layer (authorization, rate limiting, audit, schema validation).

### MCP / A2A Gateway
**Strategy: ADOPT MCP + DESIGN FOR A2A**
- **MCP**: Adopt Day 1. Build governance gateway that mediates access.
- **A2A**: Not for V1. Design agent interfaces so A2A can be adopted in V2 without architectural rework.

### Domain Ontology
**Strategy: BUILD — core IP**
- The ontology-as-code compiler is the platform's primary differentiator.
- **Architecture**: TypeScript entity definitions → compiler → PostgreSQL schemas + API endpoints + MCP tools + JSON Schema validation + OpenFGA authorization rules.
- **Key insight**: "Palantir's ontology power comes from the compiler, not a sophisticated database."
- Study Palantir (ontology structure), TypeDB (type system rigor), Semantica (decision objects), TrustGraph (context cores). Implement independently.
- **TypeDB** (MPL-2.0): Don't adopt — operational complexity too high. Inspire type system.
- **Semantica** (MIT): Borrow decision intelligence patterns.
- **TrustGraph** (Apache 2.0): Borrow context cores concept. Too operationally heavy to adopt.

### Semantic Metrics Layer
**Strategy: WRAP Cube**
- **Cube** (Apache 2.0 core): Production-ready, well-documented, strong semantic model, multi-tenancy via security context.
- Apache 2.0 core is fully functional for self-hosted deployment.
- Official MCP server is cloud-only; build custom MCP server for self-hosted Cube.
- Wrap with ontology integration and platform-specific security context.

### Context Graph
**Strategy: BUILD (inspired by Graphiti, on Apache AGE)**
- **Graphiti** (MIT): Temporal knowledge graph concepts are architecturally important.
- **Key discovery**: Graphiti's default backends (Neo4j = GPLv3, FalkorDB = SSPL) violate the open-source-first constraint.
- **Solution**: Use Apache AGE (PostgreSQL extension, Apache 2.0) as the graph backend.
- Build platform-specific integration to ontology and event store.

### Knowledge Engine
**Strategy: ADOPT pgvector (V1) + BUILD pipeline**
- **pgvector** (PostgreSQL extension): ADOPT for V1. Keeps everything in PostgreSQL.
- Graduate to **Qdrant** (Apache 2.0) when vector workloads outgrow pgvector.
- Build ingestion, chunking, and retrieval orchestration pipeline.

### Retrieval Engine
**Strategy: BUILD**
Cross-source retrieval orchestration (vector + graph + structured) is platform-specific.

### Analytical Engine
**Strategy: ADOPT DuckDB (V1) + ClickHouse (scale)**
- **DuckDB** (MIT): ADOPT for V1 embedded analytics. Zero-server deployment, excellent for analytical queries.
- **ClickHouse** (Apache 2.0): ADOPT when observability demands it (Langfuse requires ClickHouse).
- DuckDB handles V1 workloads; ClickHouse enters when event analytics scale demands it.

### Event Intelligence
**Strategy: BUILD on adopted analytical engine**
Event storage via DuckDB (V1) / ClickHouse (scale). Build pattern detection and causal analysis.

### Decision Intelligence
**Strategy: BUILD — core IP**
No mature OSS exists. Decision objects (Observation → Evidence → Hypothesis → Decision → Action → Outcome) with provenance tracking are a key differentiator. Borrow concepts from Semantica's decision object model.

### Action Engine
**Strategy: BUILD**
Action governance (authorization, validation, audit, side effects) is security-critical and platform-specific.

### Human Approval
**Strategy: BUILD on Temporal**
Build approval workflows using Temporal as the durable execution substrate.

### Durable Workflow Engine
**Strategy: ADOPT Temporal**
- **Temporal** (MIT): The only viable open-source durable workflow engine.
- **Inngest** (SSPL): EXCLUDED — cannot use in SaaS without full source disclosure.
- **Restate** (BSL 1.1): EXCLUDED — NOT open source until conversion date (typically 4 years after release).
- Temporal is operationally complex but architecturally sound and MIT-licensed.

### Memory
**Strategy: BUILD on context graph**
Agent memory should be a view over the temporal context graph, not a separate system. Agno's built-in memory model provides useful patterns.

### Metadata / Governance
**Strategy: DEFER DataHub to V2**
- **DataHub** (Apache 2.0): Too operationally heavy for V1 (requires Kafka, Elasticsearch, Neo4j, MySQL, Zookeeper).
- V1: Build lightweight metadata tracking within the platform.
- V2: Evaluate DataHub or OpenMetadata when the operational budget allows.

### Observability
**Strategy: ADOPT OTel + Langfuse**
- **OpenTelemetry** (Apache 2.0): Foundation — all components emit OTel telemetry.
- **Langfuse** (MIT core): AI-specific observability (traces, evals, prompts, cost tracking). All core features are MIT.
- Architecture: OTel for infrastructure, Langfuse for AI-specific concerns.

### Evaluation
**Strategy: ADOPT Langfuse evals + BUILD domain-specific criteria**
Framework from Langfuse; domain-specific evaluation criteria are custom.

### Cost / Metering
**Strategy: WRAP LiteLLM cost tracking + BUILD platform metering**
LiteLLM tracks token costs per provider; build budget allocation, alerting, and tenant-level metering.

### Deployment
**Strategy: ADOPT standard tooling (Kubernetes, containers)**
Well-established patterns.

### Developer Platform
**Strategy: BUILD**
Product surface — SDKs, APIs, documentation, development workflows.

---

## License-Excluded Technologies

| Technology | License | Reason for Exclusion |
|-----------|---------|---------------------|
| Inngest | SSPL | Offering as managed service requires full source disclosure |
| Restate | BSL 1.1 | Commercial use restricted until conversion date |
| Xpert | AGPL-3.0 | Network use triggers full source disclosure of combined work |
| Dify | Custom | Restricts commercial use, terms may change |
| Neo4j Community | GPLv3 | Copyleft incompatible with proprietary platform |
| FalkorDB | SSPL | Same restrictions as Inngest |

---

## Proprietary Value Areas

These are areas where building creates defensible IP:

| Area | Why It's Valuable | Confidence |
|------|-------------------|------------|
| Ontology-as-code compiler | No OSS equivalent; TypeScript definitions → compiled schemas/APIs/MCP/auth rules | High |
| Cross-domain semantic abstraction | Unifying ontology + semantic layer + context graph | Medium-High |
| Decision intelligence | First-class decision objects with provenance and outcome tracking | Medium |
| Outcome learning | Situation → intervention → outcome learning loops | Medium |
| Action governance | Authorization + validation + audit for AI actions | High |
| Ontology-to-agent compilation | Generating agent tools/capabilities from ontology definitions | High |
| Agent delegation model | User → Agent → Tool permission propagation (ReBAC-based) | High |

**WARNING:** These are hypotheses, not conclusions. Each requires validation through prototyping and market research before committing significant development resources.

---

## Summary

| Strategy | Count | Components |
|----------|-------|-----------|
| **Adopt** | 7 | OpenFGA, Temporal, DuckDB, ClickHouse, pgvector, OTel, MCP |
| **Wrap** | 4 | LiteLLM, Cube, Agno, Langfuse |
| **Build** | 12 | Ontology compiler, decision intelligence, action engine, AI gateway, experience layer, agent registry, tool registry, retrieval engine, event intelligence, human approval, memory, developer platform |
| **Excluded** | 6 | Inngest (SSPL), Restate (BSL), Xpert (AGPL), Dify (custom), Neo4j (GPL), FalkorDB (SSPL) |
| **Deferred** | 2 | DataHub (V2), A2A (V2) |

The platform is primarily a **build** project with strategic adoption of proven open-source infrastructure. The build areas concentrate in the intelligence/domain layer and the governance layer — where the platform's unique value resides. The open-source-first constraint has simplified the V1 stack significantly, with PostgreSQL + extensions serving as a unified data layer.

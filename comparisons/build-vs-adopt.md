# Build vs. Adopt Analysis

> STATUS: IN RESEARCH — architecture correction pass applied 2026-08-13
> Last updated: 2026-08-13

> **NOTE:** This document contains CANDIDATE decisions, not final architecture. No technology has completed the full selection lifecycle (research → alternative comparison → license verification → architecture fit → prototype → performance test → security test → operational assessment → ADR). See `architecture/spikes/` for validation work required.

## Core Constraint

**Prefer permissively licensed, self-hostable components where they satisfy architecture, security, reliability, and total-cost-of-ownership requirements. Paid dependencies require explicit justification.**

Every adopted component should carry a permissive license (MIT or Apache 2.0) where possible. MPL-2.0 is acceptable with discipline (file-level copyleft). SSPL, AGPL, BSL, and custom licenses are excluded from adoption — study only.

For every major component, evaluate **total cost of ownership**:
- License cost (usually $0 for OSS)
- Infrastructure cost (servers, storage, networking)
- Engineering operating cost (deployment, monitoring, upgrades, troubleshooting)
- HA/backup cost
- Security maintenance cost

Free software + 5 engineers operating it can be far more expensive than a $300/month managed service. The research must measure TCO, not license cost alone.

## Decision Framework

| Strategy | When to Use |
|----------|-------------|
| **Adopt** | Existing OSS solves the problem well; no significant modification needed |
| **Wrap** | OSS is useful but should sit behind our interfaces for flexibility |
| **Extend** | OSS solves part of the problem; needs custom work to bridge gaps |
| **Build** | Strategically important IP, or existing solutions are inadequate |

---

## CANDIDATE V1 Architecture — Leading Hypotheses

The deep research phase identified a candidate V1 architecture. The hypothesis: **PostgreSQL with extensions (Apache AGE for graphs, pgvector for vectors) could serve as a unified data layer**, reducing infrastructure complexity for an initial deployment.

**This hypothesis requires validation.** Combining transactional, vector, and graph workloads on one engine is a consequential simplification. See spike 001.

### Candidate V1 Infrastructure (Actual Footprint — Not "2 Services")

> **Previous claim corrected.** The earlier statement of "2 new services" was misleading. See `architecture/runtime-dependency-matrix.md` for the true operational footprint.

| Service | Purpose | License | Notes |
|---------|---------|---------|-------|
| PostgreSQL | Transactional data, graph (AGE), vectors (pgvector) | PostgreSQL License | Single instance hypothesis — needs spike 001 validation |
| Temporal | Durable workflows | MIT | Self-hosted — requires its own DB + visibility store |
| ClickHouse | Observability store (required by Langfuse) | Apache 2.0 | Required from Day 1 if Langfuse is adopted |
| Redis/Valkey | Caching, sessions (required by Langfuse + others) | BSD / BSD | Required by multiple components |
| Object Storage | Documents, artifacts, Langfuse blob storage | Various | S3-compatible required |
| DuckDB | Analytical query execution (embedded, NOT event store) | MIT | In-process, zero server |

**Plus application containers for:** Platform API, Agno runtime, LiteLLM proxy, OpenFGA, Cube, Langfuse (web + worker), MCP gateway, Temporal workers.

The true operational footprint is significantly larger than "2 services."

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
**Strategy: BUILD — potential core IP (scope under research)**
- The ontology compiler concept is promising but under-specified. "Core IP" is a hypothesis, not a conclusion.
- **Key insight**: "Palantir's ontology power comes from the compiler, not a sophisticated database." This insight holds, but the compiler's input format and output targets need much deeper specification.
- **Architecture hypothesis** (not decided):
  ```
  CANONICAL ONTOLOGY IR (intermediate representation)
          │
  ┌───────┼────────┐
  │       │        │
  TS    YAML     UI/API
  authoring  authoring  authoring
  │       │        │
  └───────┼────────┘
          ▼
       COMPILER
          │
  ┌───────┼─────────────┐
  ▼       ▼             ▼
  API   Permissions  Semantics
  │       │             │
  ▼       ▼             ▼
  MCP   OpenFGA    Cube models
  Tools  rules
  ```
- **The IR, not TypeScript, may be the core IP.** TypeScript is one possible authoring format. The canonical intermediate representation and the compiler are the durable abstraction.
- **Compilation targets to research**: database schema, graph schema, JSON Schema, OpenAPI specs, MCP tool definitions, OpenFGA authorization models, Cube semantic models, SDK types (TypeScript + Python), event schemas, validation rules, UI metadata, agent context definitions.
- **Authoring formats to research**: TypeScript DSL, Python/Pydantic, YAML, JSON Schema, OpenAPI, GraphQL SDL, Protocol Buffers, RDF/OWL, SHACL, TypeQL.
- **Validation required**: spike 008 must design the IR and test compilation to at least 3 targets before this becomes an architecture decision.
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
**Strategy: EXTEND/BUILD (Graphiti concepts, custom graph backend)**
- **Graphiti** (Apache 2.0, not MIT as previously recorded): Temporal knowledge graph concepts are architecturally important — bi-temporal facts, episode provenance, hybrid search.
- **Supported backends**: Neo4j (GPLv3), FalkorDB (SSPL), Amazon Neptune, deprecated Kuzu. Apache AGE is NOT an officially supported backend.
- **If using AGE**: Requires building a custom driver (query translation, index creation, full-text search adaptation, vector search, temporal queries, migrations, namespace support, test suite). This is EXTEND/BUILD effort, not ADOPT.
- **Alternative**: Use Graphiti concepts independently without the Graphiti library, building temporal fact management directly on AGE. May be simpler than writing a compatibility layer.
- **Validation required**: Architecture spike 002 must determine whether Graphiti+custom AGE driver or independent implementation is the better path.
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
**Strategy: ADOPT DuckDB (analytical querying) + ClickHouse (event analytics at scale)**
- **DuckDB** (MIT): ADOPT for V1 as an **embedded analytical query execution engine**. DuckDB is optimized for in-process analytical workloads (OLAP queries, Parquet analysis, transformations, data science). It is NOT a multi-user event store — its concurrency model is designed for single-writer embedded use.
- **ClickHouse** (Apache 2.0): Required from Day 1 if Langfuse is adopted (Langfuse requires ClickHouse). Also the correct choice for high-volume event analytics at scale.
- DuckDB handles analytical querying; ClickHouse handles event storage and observability.

### Event Intelligence
**Strategy: BUILD on PostgreSQL (V1) + ClickHouse (scale)**
- **V1**: PostgreSQL append-only event records as the authoritative event store. DuckDB for analytical querying over events.
- **Scale**: Event stream → ClickHouse for high-volume event storage and pattern detection.
- Build pattern detection and causal analysis on top of the event store.
- **Previous statement corrected**: DuckDB was incorrectly assigned event storage responsibility. DuckDB is an analytical engine, not an event store.

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

### ML Platform / Model Development
**Strategy: ADOPT open-source ML tooling + BUILD platform integration**
- The current architecture covers model **consumption** (via LiteLLM) but not model **development**.
- Capabilities needed: Dataset Registry, Feature Engineering, Training, Fine-Tuning, Experiment Tracking, Model Evaluation, Model Registry, Artifact Registry, Model Serving, Model Monitoring, Model Provenance.
- **Key distinction**: Foundation model consumption (API calls) vs. custom/specialist model development (training, fine-tuning, serving).
- All candidate libraries are permissively licensed: PyTorch (BSD), fastai (Apache 2.0), Hugging Face Transformers (Apache 2.0), PEFT (Apache 2.0), TRL (Apache 2.0), MLflow (Apache 2.0), Ray (Apache 2.0), Optuna (MIT), vLLM (Apache 2.0), BentoML (Apache 2.0), KServe (Apache 2.0), ONNX (Apache 2.0).
- **CRITICAL**: Library licenses are separate from model licenses. Every model needs its own licensing review.
- **Status**: NOT STARTED — this is a significant research gap.

### Data / Context Ingestion
**Strategy: ADOPT ingestion framework + BUILD platform integration**
- An intelligence platform cannot only define what happens **after** data arrives. Ingestion is a first-class capability.
- Capabilities needed: database connectors, CDC, API ingestion, webhooks, batch, streams, documents, files, object storage, SaaS connectors, schema discovery, schema evolution, mapping, normalization, lineage, quality, deduplication, identity resolution, backfill, reconciliation.
- Candidates: Airbyte (verify license — MIT/ELv2), Debezium (Apache 2.0), dlt (Apache 2.0), Meltano (MIT), Kafka Connect (Apache 2.0), Dagster (Apache 2.0), Apache NiFi (Apache 2.0).
- **Status**: NOT STARTED — this is a significant research gap. No architecture like Palantir/Databricks becomes useful without excellent ingestion.

### Secure Agent Compute / Sandboxing
**Strategy: BUILD or ADOPT isolation technology**
- Agents eventually need to execute: Python code, generated code, SQL, file transformations, data analysis, chart generation, document conversion, possibly browser automation.
- This CANNOT happen inside an unrestricted application process. Agents must never execute arbitrary generated code inside the core platform.
- Isolation requirements: network isolation, filesystem isolation, CPU/memory limits, execution timeout, secret access restrictions, tenant isolation, artifact handling.
- Candidates: Firecracker (Apache 2.0), gVisor (Apache 2.0), WASM/WASI, Docker sandbox, ephemeral Kubernetes jobs, E2B architecture (verify license).
- **Status**: NOT STARTED — also a threat model concern.

### Secrets / Credential Broker
**Strategy: ADOPT secrets engine + BUILD credential broker**
- Long-lived credentials must NEVER be exposed directly to an LLM. Agents should receive short-lived, scoped credentials via a broker.
- Architecture: Agent → Authorized Tool Request → Credential Broker → Short-lived scoped credential → External System.
- Credential types: API keys, database credentials, OAuth refresh tokens, MCP credentials, LLM API keys, signing keys, encryption keys.
- Candidates: OpenBao (MPL-2.0 — Vault fork), SPIFFE/SPIRE (Apache 2.0), cloud workload identity patterns, OAuth token exchange. HashiCorp Vault is BSL — verify implications.
- **Status**: NOT STARTED.

### Policy Evaluation (Separate from Authorization)
**Strategy: ADOPT OPA/Cedar + BUILD ontology rule integration**
- OpenFGA solves relationship-based authorization (who can access what based on relationships). But not every policy is a relationship.
- Example: `amount > 10,000 AND country = AE AND risk_score > 70 → require second approval` — that is policy evaluation, not ReBAC.
- Three-layer model:
  1. **Identity** — authentication
  2. **Relationship Authorization** — OpenFGA (who can access what)
  3. **Policy Evaluation** — OPA / Cedar (attribute-based rules, conditional logic)
  4. **Domain Constraints** — Ontology rules (business rules embedded in the domain model)
- Candidates: OPA (Apache 2.0), Cedar (Apache 2.0).
- **Status**: NOT STARTED — boundary between authorization and policy needs explicit documentation.

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

## Proprietary Value Areas — Hypotheses

These are areas where building **may** create defensible IP. All require validation through prototyping.

| Area | Why It May Be Valuable | Confidence | Validation Status |
|------|----------------------|------------|-------------------|
| Ontology IR + Compiler | No OSS equivalent; canonical IR compiled to schemas/APIs/MCP/auth rules. The IR is the potential core abstraction, not a specific authoring language. | Medium-High | spike 008 required |
| Cross-domain semantic abstraction | Unifying ontology + semantic layer + context graph | Medium | NOT STARTED |
| Decision intelligence | First-class decision objects with provenance and outcome tracking | Medium | NOT STARTED |
| Outcome learning | Situation → intervention → outcome learning loops | Medium-Low | NOT STARTED |
| Action governance | Authorization + validation + audit for AI actions | High | NOT STARTED |
| Ontology-to-agent compilation | Generating agent tools/capabilities from ontology definitions | Medium-High | spike 008 required |
| Agent delegation model | User → Agent → Tool permission propagation (ReBAC-based) | High | spike 004 required |

**WARNING:** These are hypotheses, not conclusions. Each requires validation through prototyping and market research before committing significant development resources. "Core IP" is a claim that must be earned through demonstrated technical differentiation, not assumed.

---

## Summary

| Strategy | Count | Components | Selection Stage |
|----------|-------|-----------|----------------|
| **Adopt** | 7 | OpenFGA, Temporal, DuckDB, ClickHouse, pgvector, OTel, MCP | All CANDIDATE |
| **Wrap** | 4 | LiteLLM, Cube, Agno, Langfuse | All CANDIDATE |
| **Extend/Build** | 1 | Graphiti concepts + AGE driver | CANDIDATE — spike 002 |
| **Build** | 12 | Ontology IR/compiler, decision intelligence, action engine, AI gateway, experience layer, agent registry, tool registry, retrieval engine, event intelligence, human approval, memory, developer platform | All CANDIDATE |
| **Not Yet Researched** | 5 | ML platform, data ingestion, secure compute, secrets management, policy evaluation | NOT STARTED |
| **Excluded** | 6 | Inngest (SSPL), Restate (BSL), Xpert (AGPL), Dify (custom), Neo4j (GPL), FalkorDB (SSPL) | REJECTED |
| **Deferred** | 2 | DataHub (V2), A2A (V2) | DEFERRED |

The platform is primarily a **build** project with strategic adoption of proven open-source infrastructure. The build areas concentrate in the intelligence/domain layer and the governance layer — where the platform's unique value resides.

**Next stage: Architecture validation spikes, NOT production implementation.** See `architecture/spikes/` for the 10 hypotheses that must be tested before any technology selection becomes final.

# Research Status

> Last updated: 2026-08-13

## Status Legend

| Status | Meaning |
|--------|---------|
| `NOT STARTED` | No research conducted |
| `IN RESEARCH` | Active investigation underway |
| `INITIAL REVIEW COMPLETE` | First pass done, major findings documented |
| `DEEP REVIEW COMPLETE` | Thorough investigation finished |
| `NEEDS VERIFICATION` | Findings need freshness check or cross-reference |
| `EXCLUDED` | Evaluated and excluded from adoption (license or maturity) |

## Core Constraint

**Prefer permissively licensed, self-hostable components where they satisfy architecture, security, reliability, and total-cost-of-ownership requirements. Paid dependencies require explicit justification.** All adopted components should carry MIT or Apache 2.0 licenses where possible. MPL-2.0 acceptable with discipline. SSPL, AGPL, BSL, and custom licenses excluded from adoption (study only). For every major component, evaluate total cost of ownership (license + infrastructure + engineering + operations + HA + backup + security maintenance), not license cost alone.

## Technology Selection Lifecycle

A technology cannot become SELECTED until it passes all stages:

| Stage | Meaning |
|-------|---------|
| `RESEARCHING` | Active investigation underway |
| `CANDIDATE` | Proposed for adoption — research supports it but alternatives may not be fully evaluated |
| `VALIDATING` | Architecture spike or prototype in progress |
| `SELECTED` | ADR approved — alternatives researched, license verified, architecture fit documented, prototype completed, performance/security/operational cost evaluated |
| `REJECTED` | Evaluated and rejected (with documented reasons) |
| `DEFERRED` | Not for V1, planned for future evaluation |
| `SUPERSEDED` | Previously selected/candidate but replaced by a newer decision |

**Current state:** Most technologies below are CANDIDATE, not SELECTED. Several have not completed alternative comparison, prototype validation, or operational cost assessment.

---

## CANDIDATE V1 ARCHITECTURE — LEADING HYPOTHESES

> **These are leading hypotheses, not final architecture decisions.** Several alternatives remain unresearched. The PostgreSQL unified data layer is a consequential simplification that needs workload validation (spike 001). The ontology compiler scope needs deeper specification (spike 008). The true infrastructure footprint has not been calculated (see `architecture/runtime-dependency-matrix.md`). Entire capability areas are missing from the candidate architecture (ML platform, data ingestion, secure compute, secrets management). Treat all entries below as CANDIDATE pending validation.

| Layer | Technology | License | Strategy | Selection Stage |
|-------|-----------|---------|----------|----------------|
| Unified Data | PostgreSQL + Apache AGE + pgvector | PostgreSQL License / Apache 2.0 | ADOPT | CANDIDATE — spike 001 required |
| Agent Runtime | Agno | Apache 2.0 | WRAP (primary) | CANDIDATE — spike 005 required |
| Agent Runtime (complex) | LangGraph | MIT | WRAP (secondary) | CANDIDATE — spike 005 required |
| Durable Workflows | Temporal | MIT | ADOPT | CANDIDATE — spike 006 required |
| Model Gateway | LiteLLM | MIT (core) | WRAP | CANDIDATE |
| Authorization | OpenFGA | Apache 2.0 (CNCF) | ADOPT | CANDIDATE — spike 004 required |
| Policy Evaluation | OPA / Cedar | Apache 2.0 | ADOPT | RESEARCHING — separate from ReBAC |
| Semantic Layer | Cube | Apache 2.0 (core) | WRAP | CANDIDATE — spike 003 required |
| AI Observability | Langfuse | MIT (core) | ADOPT | CANDIDATE — infrastructure cost underestimated |
| Analytical Querying | DuckDB | MIT | ADOPT (analytical engine, NOT event store) | CANDIDATE |
| Observability Store | ClickHouse | Apache 2.0 | ADOPT (required by Langfuse) | CANDIDATE |
| Tool Protocol | MCP | MIT | ADOPT | CANDIDATE — spike 007 required |
| Context Graph | Graphiti concepts + AGE | Apache 2.0 | EXTEND/BUILD (not ADOPT — AGE driver needed) | CANDIDATE — spike 002 required |
| ML/AI Infrastructure | PyTorch, Transformers, vLLM, etc. | Apache 2.0 / BSD | ADOPT | RESEARCHING — libraries free; models need individual review |
| Ontology | Ontology IR + Compiler | — | BUILD | RESEARCHING — IR concept needs design (spike 008) |
| Data Ingestion | TBD (Airbyte, Debezium, dlt, etc.) | Various | TBD | NOT STARTED |
| Secure Compute | TBD (Firecracker, gVisor, WASM, etc.) | Various | TBD | NOT STARTED |
| Secrets Management | TBD (OpenBao, SPIFFE/SPIRE, etc.) | Various | TBD | NOT STARTED |

### Open Questions Before Any Technology Becomes SELECTED

1. **PostgreSQL unified data layer** — Can one PostgreSQL instance handle transactional + vector (pgvector) + graph (AGE) workloads simultaneously? What are the scale boundaries, HA/backup implications, performance trade-offs, and blast radius? → spike 001
2. **Graphiti + AGE compatibility** — AGE is NOT an officially supported Graphiti backend. What is the engineering cost of a custom driver vs. building temporal facts independently? → spike 002
3. **Ontology compiler scope** — What is the canonical IR? What compilation targets? What authoring interfaces? TypeScript is one option, not the assumed answer. → spike 008
4. **True infrastructure footprint** — Langfuse alone requires app + PG + ClickHouse + Redis + object storage. Add Temporal, Cube, LiteLLM, OpenFGA, platform services. The "2 services" claim is incorrect. → runtime-dependency-matrix.md
5. **DuckDB role** — DuckDB is an embedded analytical engine, not an event store. V1 events should be PostgreSQL append-only; DuckDB handles analytical querying. → architecture correction
6. **Unresearched alternatives** — Weaviate (vectors), Pinot/Druid (real-time analytics), Prefect/Airflow (orchestration), ingestion tools, secure compute, secrets management have not been evaluated.
7. **Model licensing** — Library licenses (Apache 2.0, BSD) are separate from model licenses. Every model adopted needs its own licensing review.
8. **Missing capability areas** — ML platform (model development), data ingestion, secure agent compute, secrets/credential brokering, policy evaluation (separate from ReBAC) are not yet addressed.
9. **Multi-tenant isolation** — How does isolation work across all components simultaneously? → spike 010
10. **Total cost of ownership** — Free software + N engineers operating it can be more expensive than a managed service. Each component needs TCO analysis, not just license review.

---

## Commercial Platforms

| Platform | Status | Last Updated | Notes |
|----------|--------|--------------|-------|
| Palantir | `INITIAL REVIEW COMPLETE` | 2026-08-13 | Foundry, AIP, Ontology studied — key architectural inspiration |
| Databricks | `INITIAL REVIEW COMPLETE` | 2026-08-13 | Unity Catalog, Genie, Mosaic AI, MCP studied |
| Snowflake | `INITIAL REVIEW COMPLETE` | 2026-08-13 | Cortex suite, Semantic Views studied |
| Microsoft | `INITIAL REVIEW COMPLETE` | 2026-08-13 | Foundry, Agent Framework, identity delegation patterns |
| AWS | `INITIAL REVIEW COMPLETE` | 2026-08-13 | AgentCore, knowledge bases, observability |
| Google | `INITIAL REVIEW COMPLETE` | 2026-08-13 | ADK, A2A protocol, Gemini enterprise |
| Salesforce | `INITIAL REVIEW COMPLETE` | 2026-08-13 | Agentforce, Data Cloud |

## Open-Source — Ontology & Context

| Project | Status | Last Updated | Notes |
|---------|--------|--------------|-------|
| Semantica | `DEEP REVIEW COMPLETE` | 2026-08-13 | MIT. Decision objects valuable. Borrow patterns, don't adopt. |
| TrustGraph | `DEEP REVIEW COMPLETE` | 2026-08-13 | Apache 2.0. Context Cores concept valuable. Too operationally heavy. |
| Graphiti | `DEEP REVIEW COMPLETE` | 2026-08-13 | Apache 2.0. Temporal knowledge graph concepts valuable. AGE is NOT an officially supported backend — supported: Neo4j, FalkorDB, Neptune. Using with AGE = EXTEND/BUILD (custom driver required). |
| TypeDB | `DEEP REVIEW COMPLETE` | 2026-08-13 | MPL-2.0. Don't adopt — too complex. Inspire type system design. |
| TerminusDB | `DEEP REVIEW COMPLETE` | 2026-08-13 | Apache 2.0. Borrow versioning concepts. |

## Open-Source — Semantic Layer

| Project | Status | Last Updated | Notes |
|---------|--------|--------------|-------|
| Cube | `DEEP REVIEW COMPLETE` | 2026-08-13 | Apache 2.0 core fully functional self-hosted. ADOPT. Build custom MCP server. |
| Rill | `INITIAL REVIEW COMPLETE` | 2026-08-13 | Apache 2.0. Interesting for embedded analytics, not a semantic layer replacement. |

## Open-Source — Agent Runtime

| Project | Status | Last Updated | Notes |
|---------|--------|--------------|-------|
| Agno | `DEEP REVIEW COMPLETE` | 2026-08-13 | Apache 2.0. PRIMARY runtime — RBAC, multi-tenancy, PostgreSQL-native, teams, memory. |
| LangGraph | `DEEP REVIEW COMPLETE` | 2026-08-13 | MIT. SECONDARY runtime — best for complex state machines, largest community. |
| Google ADK | `DEEP REVIEW COMPLETE` | 2026-08-13 | Apache 2.0. Best A2A/MCP support. Consider for V2. |
| Strands | `DEEP REVIEW COMPLETE` | 2026-08-13 | Apache 2.0. AWS-backed but too new and limited docs. Monitor. |
| Microsoft Agent Framework | `DEEP REVIEW COMPLETE` | 2026-08-13 | MIT. Very new. Enterprise focus. Monitor. |

## Open-Source — Model Gateway

| Project | Status | Last Updated | Notes |
|---------|--------|--------------|-------|
| LiteLLM | `DEEP REVIEW COMPLETE` | 2026-08-13 | MIT core genuine. ADOPT. Use OpenFGA for auth instead of LiteLLM enterprise RBAC. |

## Open-Source — Knowledge & Retrieval

| Project | Status | Last Updated | Notes |
|---------|--------|--------------|-------|
| pgvector | `DEEP REVIEW COMPLETE` | 2026-08-13 | PostgreSQL extension. ADOPT for V1. Graduate to Qdrant at scale. |
| LanceDB | `INITIAL REVIEW COMPLETE` | 2026-08-13 | Apache 2.0. Interesting but pgvector preferred for V1 unification. |
| Qdrant | `INITIAL REVIEW COMPLETE` | 2026-08-13 | Apache 2.0. V2 candidate when pgvector outgrown. |
| Weaviate | `NOT STARTED` | — | — |

## Open-Source — Analytics

| Project | Status | Last Updated | Notes |
|---------|--------|--------------|-------|
| DuckDB | `DEEP REVIEW COMPLETE` | 2026-08-13 | MIT. ADOPT for V1 embedded analytics. Zero-server deployment. |
| ClickHouse | `DEEP REVIEW COMPLETE` | 2026-08-13 | Apache 2.0. ADOPT when Langfuse demands it. Not needed until observability scale. |
| Apache Pinot | `NOT STARTED` | — | Real-time analytics |
| Apache Druid | `NOT STARTED` | — | — |

## Open-Source — Authorization

| Project | Status | Last Updated | Notes |
|---------|--------|--------------|-------|
| OpenFGA | `DEEP REVIEW COMPLETE` | 2026-08-13 | Apache 2.0, CNCF Incubating. ADOPT. Sub-ms performance. Build delegation layer on top. |
| SpiceDB | `INITIAL REVIEW COMPLETE` | 2026-08-13 | Apache 2.0. Strong alternative but OpenFGA has better CNCF backing. |
| OPA | `INITIAL REVIEW COMPLETE` | 2026-08-13 | Apache 2.0. Complementary for policy enforcement, not ReBAC replacement. |

## Open-Source — Observability

| Project | Status | Last Updated | Notes |
|---------|--------|--------------|-------|
| Langfuse | `DEEP REVIEW COMPLETE` | 2026-08-13 | MIT core. All core features MIT. ADOPT. Requires ClickHouse. |
| OpenTelemetry | `DEEP REVIEW COMPLETE` | 2026-08-13 | Apache 2.0. Foundation for all observability. ADOPT. |
| Arize Phoenix | `INITIAL REVIEW COMPLETE` | 2026-08-13 | Apache 2.0. Alternative to Langfuse, less feature-rich. |

## Open-Source — Workflows

| Project | Status | Last Updated | Notes |
|---------|--------|--------------|-------|
| Temporal | `DEEP REVIEW COMPLETE` | 2026-08-13 | MIT. ADOPT. Only viable open-source durable workflow engine. |
| Inngest | `EXCLUDED` | 2026-08-13 | SSPL — cannot use in SaaS. Excluded. |
| Restate | `EXCLUDED` | 2026-08-13 | BSL 1.1 — NOT open source until conversion date. Excluded. |

## Open-Source — Metadata & Governance

| Project | Status | Last Updated | Notes |
|---------|--------|--------------|-------|
| DataHub | `DEEP REVIEW COMPLETE` | 2026-08-13 | Apache 2.0. DEFER to V2 — too operationally heavy for V1. |
| OpenMetadata | `INITIAL REVIEW COMPLETE` | 2026-08-13 | Apache 2.0. Alternative to DataHub, simpler. |

## Open-Source — Protocols

| Project | Status | Last Updated | Notes |
|---------|--------|--------------|-------|
| MCP | `DEEP REVIEW COMPLETE` | 2026-08-13 | MIT. ADOPT Day 1. Target 2025-06-18 spec. Build governance layer. |
| A2A | `DEEP REVIEW COMPLETE` | 2026-08-13 | Apache 2.0. NOT for V1. Design for compatibility, adopt in V2. |

## Open-Source — Emerging Platforms

| Project | Status | Last Updated | Notes |
|---------|--------|--------------|-------|
| Xpert | `EXCLUDED` | 2026-08-13 | AGPL-3.0. Study only. Do not adopt. |
| Dify | `EXCLUDED` | 2026-08-13 | Custom license. Study only. Do not adopt. |
| Wanwu | `NEEDS VERIFICATION` | 2026-08-13 | License unverified |
| OpenFang | `NEEDS VERIFICATION` | 2026-08-13 | License unverified |
| Agnt | `NEEDS VERIFICATION` | 2026-08-13 | License unverified |
| Compozy | `NEEDS VERIFICATION` | 2026-08-13 | License unverified |

## Open-Source — Data Ingestion

| Project | Status | Last Updated | Notes |
|---------|--------|--------------|-------|
| Airbyte | `NOT STARTED` | — | Verify license (MIT core / ELv2 for some connectors) |
| Debezium | `NOT STARTED` | — | Apache 2.0. CDC for databases |
| dlt | `NOT STARTED` | — | Apache 2.0. Python data loading |
| Meltano | `NOT STARTED` | — | MIT. ELT for data integration |
| Kafka Connect | `NOT STARTED` | — | Apache 2.0. Connector framework |
| Apache NiFi | `NOT STARTED` | — | Apache 2.0. Data flow automation |
| Estuary Flow | `NOT STARTED` | — | Verify license. Real-time CDC |

## Open-Source — Secure Compute / Sandboxing

| Project | Status | Last Updated | Notes |
|---------|--------|--------------|-------|
| Firecracker | `NOT STARTED` | — | Apache 2.0. MicroVM isolation (AWS) |
| gVisor | `NOT STARTED` | — | Apache 2.0. Application kernel sandbox (Google) |
| WASM/WASI | `NOT STARTED` | — | Various. WebAssembly-based isolation |
| E2B | `NOT STARTED` | — | Verify license. Code interpreter sandboxing |

## Open-Source — Secrets / Identity

| Project | Status | Last Updated | Notes |
|---------|--------|--------------|-------|
| OpenBao | `NOT STARTED` | — | MPL-2.0. HashiCorp Vault fork |
| SPIFFE/SPIRE | `NOT STARTED` | — | Apache 2.0. Workload identity |
| HashiCorp Vault | `NOT STARTED` | — | BSL — verify implications |

## Open-Source — Policy Evaluation

| Project | Status | Last Updated | Notes |
|---------|--------|--------------|-------|
| OPA | `INITIAL REVIEW COMPLETE` | 2026-08-13 | Apache 2.0. Complementary for policy, not ReBAC replacement. Needs deeper evaluation for policy layer. |
| Cedar | `NOT STARTED` | — | Apache 2.0. AWS policy language |

## Architecture Deliverables

| Deliverable | Status | Last Updated |
|-------------|--------|--------------|
| Capability Model | `IN RESEARCH` | 2026-08-13 | Updated: 31 capabilities (added ML platform, ingestion, secure compute, secrets, policy) |
| Reference Architecture | `IN RESEARCH` | 2026-08-13 | Needs update for new capabilities |
| Security Threat Model | `IN RESEARCH` | 2026-08-13 | Needs trust-boundary architecture (not just checklist) |
| Deployment Architecture | `IN RESEARCH` | 2026-08-13 | Infrastructure footprint corrected |
| Runtime Dependency Matrix | `IN RESEARCH` | 2026-08-13 | NEW: true operational footprint |
| Ontology Architecture | `IN RESEARCH` | 2026-08-13 | Updated: IR concept, removed TypeScript assumption |
| Workflow Architecture | `DEEP REVIEW COMPLETE` | 2026-08-13 | Temporal guarantees corrected |
| Commercial Platform Matrix | `INITIAL REVIEW COMPLETE` | 2026-08-13 |
| Open-Source Matrix | `IN RESEARCH` | 2026-08-13 | Contradictions being resolved |
| Licensing Matrix | `IN RESEARCH` | 2026-08-13 | Methodology corrected, legal precision improved |
| Build vs Adopt Analysis | `IN RESEARCH` | 2026-08-13 | Downgraded from DEEP REVIEW — decisions are CANDIDATE not SELECTED |
| Architecture Spikes | `NOT STARTED` | 2026-08-13 | NEW: 10 validation spikes defined |
| ADR Process | `INITIAL REVIEW COMPLETE` | 2026-08-13 |

## Open-Source — ML/AI Infrastructure

> These are the foundational ML/AI libraries and serving tools. All have permissive licenses. **Model licenses are separate from library licenses** — every model needs its own review.

| Project | Status | Last Updated | License | Notes |
|---------|--------|--------------|---------|-------|
| PyTorch | `NOT STARTED` | — | BSD-style | Core ML framework. Free for all use. |
| fastai | `NOT STARTED` | — | Apache 2.0 | High-level training library on PyTorch |
| Hugging Face Transformers | `NOT STARTED` | — | Apache 2.0 | Model hub + inference library. Library is free; individual models have separate licenses. |
| vLLM | `NOT STARTED` | — | Apache 2.0 | High-throughput LLM serving engine |
| MLflow | `NOT STARTED` | — | Apache 2.0 | Experiment tracking, model registry, deployment |
| BentoML | `NOT STARTED` | — | Apache 2.0 | Model serving framework. BentoCloud is paid hosted option. |
| Ray | `NOT STARTED` | — | Apache 2.0 | Distributed compute framework. Anyscale is paid hosted option. |

### Model Licensing — Separate Concern

| Category | Examples | License Status |
|----------|---------|---------------|
| Library code | PyTorch, Transformers, vLLM | Permissive (Apache 2.0 / BSD) — free for commercial use |
| Open-weight models | Llama 3, Mistral, Gemma | **VARIES per model** — each needs individual review |
| API-served models | Claude, GPT-4, Gemini | Pay-per-use — no license concern, but creates commercial dependency |
| Fine-tuned models | Custom fine-tunes | Inherit base model license + training data considerations |

**Action required:** Before adopting any specific model, read its license. The library being Apache 2.0 does NOT mean the model is unrestricted.

## Data Pipelines

| Project | Status | Last Updated | Notes |
|---------|--------|--------------|-------|
| Dagster | `INITIAL REVIEW COMPLETE` | 2026-08-13 | Apache 2.0. Assets, lineage |
| Prefect | `NOT STARTED` | — | — |
| Airflow | `NOT STARTED` | — | — |

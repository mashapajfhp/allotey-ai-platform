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

**Open-source first. No paid dependencies for V1.** All adopted components must be MIT or Apache 2.0. MPL-2.0 acceptable with discipline. SSPL, AGPL, BSL, and custom licenses excluded from adoption (study only).

---

## V1 Technology Stack (Converged)

| Layer | Technology | License | Strategy |
|-------|-----------|---------|----------|
| Unified Data | PostgreSQL + Apache AGE + pgvector | PostgreSQL License / Apache 2.0 | ADOPT |
| Agent Runtime | Agno | Apache 2.0 | WRAP (primary) |
| Agent Runtime (complex) | LangGraph | MIT | WRAP (secondary) |
| Durable Workflows | Temporal | MIT | ADOPT |
| Model Gateway | LiteLLM | MIT (core) | WRAP |
| Authorization | OpenFGA | Apache 2.0 (CNCF) | ADOPT |
| Semantic Layer | Cube | Apache 2.0 (core) | WRAP |
| AI Observability | Langfuse | MIT (core) | ADOPT |
| Embedded Analytics | DuckDB | MIT | ADOPT |
| Observability Store | ClickHouse | Apache 2.0 | ADOPT (via Langfuse) |
| Tool Protocol | MCP | MIT | ADOPT |
| Ontology | Custom compiler | — | BUILD (core IP) |

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
| Graphiti | `DEEP REVIEW COMPLETE` | 2026-08-13 | MIT. ADOPT temporal knowledge graph with Apache AGE backend (not Neo4j/FalkorDB). |
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

## Architecture Deliverables

| Deliverable | Status | Last Updated |
|-------------|--------|--------------|
| Capability Model | `INITIAL REVIEW COMPLETE` | 2026-08-13 |
| Reference Architecture | `INITIAL REVIEW COMPLETE` | 2026-08-13 |
| Security Threat Model | `INITIAL REVIEW COMPLETE` | 2026-08-13 |
| Commercial Platform Matrix | `INITIAL REVIEW COMPLETE` | 2026-08-13 |
| Open-Source Matrix | `DEEP REVIEW COMPLETE` | 2026-08-13 |
| Licensing Matrix | `DEEP REVIEW COMPLETE` | 2026-08-13 |
| Build vs Adopt Analysis | `DEEP REVIEW COMPLETE` | 2026-08-13 |
| ADR Process | `INITIAL REVIEW COMPLETE` | 2026-08-13 |

## Data Pipelines

| Project | Status | Last Updated | Notes |
|---------|--------|--------------|-------|
| Dagster | `INITIAL REVIEW COMPLETE` | 2026-08-13 | Apache 2.0. Assets, lineage |
| Prefect | `NOT STARTED` | — | — |
| Airflow | `NOT STARTED` | — | — |

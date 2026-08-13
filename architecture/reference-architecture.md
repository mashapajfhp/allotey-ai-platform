# Reference Architecture

> STATUS: INITIAL REVIEW COMPLETE
> Last updated: 2026-08-13

This document defines the vendor-neutral reference architecture for the enterprise AI / operational intelligence platform. Technology choices are not committed here — this is the structural blueprint.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        APPLICATIONS                                 │
│   Chat │ Dashboards │ Embedded Analytics │ APIs │ SDKs │ Webhooks   │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    AI / INTELLIGENCE GATEWAY                        │
│                                                                     │
│  ┌──────────┐ ┌──────────────┐ ┌───────────┐ ┌──────────┐         │
│  │ Identity │ │Authorization │ │Rate Limits│ │Cost/     │         │
│  │          │ │              │ │           │ │Budget    │         │
│  └──────────┘ └──────────────┘ └───────────┘ └──────────┘         │
│  ┌──────────────────┐ ┌─────────────────────┐                      │
│  │ Governance       │ │ Tenant Isolation     │                      │
│  │ Policies         │ │                      │                      │
│  └──────────────────┘ └─────────────────────┘                      │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   AGENT / WORKFLOW RUNTIME                          │
│                                                                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐             │
│  │ Agents   │ │ Tools    │ │ Memory   │ │ Approvals │             │
│  │          │ │          │ │          │ │           │             │
│  └──────────┘ └──────────┘ └──────────┘ └───────────┘             │
│  ┌──────────────────┐ ┌─────────────────────┐                      │
│  │ Multi-Agent      │ │ Durable Workflows   │                      │
│  │ Orchestration    │ │                      │                      │
│  └──────────────────┘ └─────────────────────┘                      │
│  ┌──────────────────┐ ┌─────────────────────┐                      │
│  │ MCP Gateway      │ │ A2A Gateway         │                      │
│  │ (agent↔tools)    │ │ (agent↔agent)       │                      │
│  └──────────────────┘ └─────────────────────┘                      │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                 INTELLIGENCE CONTROL PLANE                          │
│                                                                     │
│  ┌──────────────┐ ┌───────────────┐ ┌──────────────┐              │
│  │ Domain       │ │ Semantic      │ │ Metadata     │              │
│  │ Ontology     │ │ Metrics Layer │ │ Graph        │              │
│  └──────────────┘ └───────────────┘ └──────────────┘              │
│  ┌──────────────┐ ┌───────────────┐ ┌──────────────┐              │
│  │ Context      │ │ Tool          │ │ Agent        │              │
│  │ Graph        │ │ Registry      │ │ Registry     │              │
│  └──────────────┘ └───────────────┘ └──────────────┘              │
│  ┌──────────────┐ ┌───────────────┐ ┌──────────────┐              │
│  │ Decision     │ │ Policies &    │ │ Model        │              │
│  │ Intelligence │ │ Constraints   │ │ Gateway      │              │
│  └──────────────┘ └───────────────┘ └──────────────┘              │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  INTELLIGENCE DATA PLANE                            │
│                                                                     │
│  ┌──────────────┐ ┌───────────────┐ ┌──────────────┐              │
│  │Transactional │ │ Analytical    │ │ Events       │              │
│  │Data          │ │ Data          │ │              │              │
│  └──────────────┘ └───────────────┘ └──────────────┘              │
│  ┌──────────────┐ ┌───────────────┐ ┌──────────────┐              │
│  │ Documents    │ │ Vectors       │ │ Graphs       │              │
│  │              │ │               │ │              │              │
│  └──────────────┘ └───────────────┘ └──────────────┘              │
└─────────────────────────────────────────────────────────────────────┘

╔═════════════════════════════════════════════════════════════════════╗
║                     CROSS-CUTTING CONCERNS                         ║
║                                                                     ║
║  Observability │ Evaluation │ Security │ Provenance │ Audit │ Cost  ║
╚═════════════════════════════════════════════════════════════════════╝
```

---

## Layer Descriptions

### Applications Layer

The topmost layer. All consumers of the platform's intelligence capabilities.

**Responsibilities:**
- Render agent responses in appropriate formats (chat, dashboard, API response)
- Manage user sessions and interaction state
- Provide domain-specific UX (analytics dashboards, operational views, chat interfaces)
- Support embeddable components for integration into external applications

**Key principle:** The applications layer never talks directly to data stores or models. All intelligence flows through the gateway.

### AI / Intelligence Gateway

The single governed entry point. Every request — whether from a user, an application, a scheduled job, or an external system — passes through this gateway.

**Responsibilities:**
- Authenticate the requesting identity (user, service, agent)
- Resolve authorization — what can this identity do?
- Enforce rate limits and cost budgets
- Apply governance policies (data classification, compliance rules)
- Route to appropriate agent or service
- Enforce tenant isolation — no request can access another tenant's data
- Produce audit records for every request

**Key principle:** Nothing bypasses the gateway. If it's not authorized, it doesn't execute.

**Identity delegation model:**
```
User authenticates
    → Gateway validates identity
        → Agent inherits user's authorization context
            → Tool invocations are bounded by user's permissions
                → Data access is filtered to user's authorized scope
```

This is the On-Behalf-Of pattern observed in Microsoft's architecture. The agent never has more permissions than the user it represents.

### Agent / Workflow Runtime

Where reasoning and execution happen.

**Two distinct runtime concerns:**

1. **Agent Reasoning Runtime** — ephemeral, restartable
   - LLM interaction loops
   - Tool selection and invocation
   - Multi-step reasoning chains
   - Multi-agent orchestration
   - Context assembly
   - Response generation

2. **Durable Workflow Runtime** — persistent, exactly-once
   - Long-running business processes
   - Human approval waits
   - Scheduled operations
   - Retry logic with compensation
   - State that survives system restarts

These are **not the same thing**. Agent reasoning may be part of a durable workflow step, but the workflow engine outlives the agent's reasoning loop.

**Protocol gateways:**
- **MCP Gateway** — manages agent ↔ tool/context connections via Model Context Protocol
- **A2A Gateway** — manages agent ↔ agent communication via A2A protocol

### Intelligence Control Plane

Defines **what the system knows** — the domain model, business metrics, policies, and registries that govern all intelligence operations.

**Domain Ontology:** The authoritative model of business entities, relationships, actions, and rules. Inspired by Palantir's Ontology concept: Data + Logic + Actions + Security. More powerful than a BI semantic layer because it includes operational actions and security constraints, not just analytical definitions.

**Semantic Metrics Layer:** Declarative business metric definitions — measures, dimensions, time grains, calculation logic. Ensures every consumer computes metrics consistently. Inspired by Cube, Snowflake Semantic Views, and Databricks AI/BI.

**Context Graph:** The live state of entities, facts, and relationships. Supports temporal queries, provenance, and relationship traversal. Distinct from the ontology (which defines types) — the context graph contains instances.

**Metadata Graph:** Information about data — ownership, lineage, quality, schema, domain, policies. The governance substrate. Inspired by DataHub and Databricks Unity Catalog.

**Registries:** Agent and tool catalogs with capability descriptions, permissions, and version tracking.

**Model Gateway:** Abstracts LLM providers. Routes requests, manages fallbacks, tracks costs, enforces rate limits. The system treats models as replaceable infrastructure.

### Intelligence Data Plane

The physical storage layer. Multiple specialized stores, each optimized for its workload.

| Store | Purpose | Example Technologies |
|-------|---------|---------------------|
| Transactional | Current business state | PostgreSQL, MySQL |
| Analytical | Aggregated/historical analytics | ClickHouse, DuckDB |
| Events | Immutable event log | ClickHouse, Kafka |
| Documents | Unstructured content | Object storage, document DB |
| Vectors | Embeddings for semantic search | LanceDB, pgvector, Qdrant |
| Graphs | Entity relationships | Neo4j, TypeDB, PostgreSQL+ltree |

**Key principle:** The data plane is accessed through the control plane. Agents never query raw databases directly — they query through the ontology, semantic layer, and retrieval engine.

### Cross-Cutting Concerns

These span all layers:

**Observability:** Traces, spans, metrics, and logs across every operation. Built on OpenTelemetry as the lowest-level standard, with AI-specific enrichment (token counts, model latency, tool call success rates).

**Evaluation:** Systematic measurement of agent quality — correctness, relevance, safety, cost, latency. Supports automated evaluation, A/B testing, and regression detection.

**Security:** Defense against prompt injection, tool injection, privilege escalation, cross-tenant leakage, and all AI-specific attack vectors. See `architecture/security-threat-model.md`.

**Provenance:** Every recommendation, decision, and action carries a complete provenance chain — what evidence was used, what model produced it, what semantic definitions were active, who authorized it.

**Audit:** Immutable record of all significant platform operations. Supports compliance, forensics, and accountability.

**Cost:** Token-level cost tracking, budget enforcement, cost allocation by tenant/team/agent, alerting.

---

## Information Flow

### Query Flow (Analytics)

```
User asks: "What was revenue by region last quarter?"
    │
    ▼
AI Gateway: authenticate, authorize, route
    │
    ▼
Agent Runtime: select appropriate tool (analytics query)
    │
    ▼
Semantic Metrics Layer: resolve "revenue" and "region" to canonical definitions
    │
    ▼
Query Engine: generate SQL from semantic model
    │
    ▼
Analytical Database: execute query
    │
    ▼
Agent Runtime: format response with provenance
    │
    ▼
Applications: render to user
```

### Action Flow (Operational)

```
Agent recommends: "Approve purchase order PO-12345"
    │
    ▼
Domain Ontology: validate PO-12345 exists, resolve action schema
    │
    ▼
Authorization: verify user can approve POs in this cost range
    │
    ▼
Human Approval: pause workflow, notify approver
    │
    ▼
Approver confirms
    │
    ▼
Action Engine: execute approval action
    │
    ▼
Transactional Database: update PO status
    │
    ▼
Event Store: record approval event with full provenance
    │
    ▼
Observability: trace complete action chain
```

### Decision Flow (Intelligence)

```
System observes: inventory levels dropping in Region A
    │
    ▼
Event Intelligence: detect pattern (3rd consecutive week of decline)
    │
    ▼
Context Graph: retrieve related entities (suppliers, orders, seasonality)
    │
    ▼
Decision Intelligence: formulate hypothesis with evidence
    │
    ▼
Agent Runtime: generate recommendation with confidence score
    │
    ▼
Provenance Engine: attach evidence chain, model info, semantic definitions
    │
    ▼
Human Approval: present recommendation with full context
    │
    ▼
Action Engine: execute approved intervention
    │
    ▼
Outcome Tracking: record decision → action → outcome for future learning
```

---

## Design Principles

1. **Gateway-mediated access** — no component bypasses the intelligence gateway
2. **Ontology-first operations** — agents operate on domain abstractions, not raw data
3. **Identity delegation** — agent permissions are bounded by user permissions
4. **Temporal awareness** — the system knows not just what is true, but what was true and when things changed
5. **Provenance by default** — every output carries its evidence chain
6. **Separation of reasoning and durability** — ephemeral agent thinking vs. persistent business workflows
7. **Metrics consistency** — one definition of each metric, everywhere
8. **Model independence** — any LLM can be swapped without architectural change
9. **Protocol-first integration** — MCP for tool access, A2A for agent communication
10. **Least privilege** — every component operates with minimum necessary permissions

---

## What This Architecture Does NOT Prescribe

- Specific programming languages (though TypeScript and Python are primary candidates)
- Specific cloud provider
- Specific deployment topology (monolith vs. microservices — start simple, extract when justified)
- Specific LLM provider
- Specific database brands (these will be selected through research)
- Implementation sequence (that comes from ADRs and project planning)

---

## Architecture Influences

| Concept | Primary Influence | What We Learn |
|---------|-------------------|---------------|
| Ontology as operational abstraction | Palantir Foundry | Data + Logic + Actions + Security |
| Semantic metrics consistency | Cube, Snowflake Semantic Views | Declarative metric definitions |
| Shared governance control plane | Databricks Unity Catalog | Unified metadata and access control |
| Identity delegation | Microsoft Agent Framework | User → Agent → Tool permission flow |
| Domain-grounded agents | Salesforce Agentforce | Agents operate on business objects |
| Temporal knowledge | Graphiti | Facts with time validity |
| Relationship-based authorization | OpenFGA / Zanzibar | ReBAC for complex permission models |
| Durable workflows | Temporal | Deterministic replay, long-running processes |
| Model abstraction | LiteLLM | Provider-agnostic LLM access |
| AI observability | Langfuse + OpenTelemetry | Traces, evals, cost tracking |

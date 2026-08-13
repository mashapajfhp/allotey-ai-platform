# Reference Architecture

> STATUS: INITIAL REVIEW COMPLETE
> Last updated: 2026-08-13

This document defines the vendor-neutral reference architecture for the enterprise AI platform. Technology choices are not committed here — this is the structural blueprint.

**Foundational constraint:** The platform is product-agnostic. The core must not contain assumptions about any specific application domain, workflow, entity type, industry, or product. Domain-specific concepts enter only through explicit extension mechanisms. See `AGENTS.md` rules 6 and 7.

---

## Conceptual Architecture — Platform vs. Domain

The fundamental architectural split: the platform is generic; intelligence enters through packages.

```
┌─────────────────────────────────────────────────┐
│              PRODUCT / DOMAIN LAYER             │
│                                                 │
│ Ontologies   Semantics   Agents   Tools         │
│ Policies     Workflows   Connectors             │
└────────────────────┬────────────────────────────┘
                     │
               Stable Platform API
                     │
┌────────────────────▼────────────────────────────┐
│            ENTERPRISE AI PLATFORM               │
│                                                 │
│ Intelligence Gateway                            │
│ Model Gateway                                   │
│ Agent Runtime                                   │
│ Tool / MCP Gateway                              │
│ Ontology Runtime / Compiler                     │
│ Context / Knowledge                             │
│ Decision & Action Governance                    │
│ Authorization / Policy                          │
│ Workflow Runtime                                │
│ Evaluation / Observability                      │
│ Provenance / Audit                              │
│ Cost / Metering                                 │
│ Secure Compute                                  │
│ Developer Platform                              │
└────────────────────┬────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────┐
│          INFRASTRUCTURE / DATA                  │
│ Databases │ Graph │ Vector │ Events │ ML        │
└─────────────────────────────────────────────────┘
```

**The platform stays generic; intelligence enters through packages.** A Domain Package contains all domain-specific artifacts — ontology definitions, semantic models, agents, tools, workflows, policies, connectors, evaluations, prompts, and migrations. See `architecture/domain-package-architecture.md`.

**Validation test:** Build two deliberately unrelated synthetic domains during the architecture-spike phase. If both can be modeled without changing `/core`, the abstraction is healthy. If core code starts filling with domain conditionals, the boundary is wrong.

---

## Architecture Overview (Detailed)

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
│  ┌──────────────────┐ ┌─────────────────────┐                      │
│  │ Secure Compute   │ │ Credential Broker   │                      │
│  │ (sandboxing)     │ │ (secrets)           │                      │
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
│  ┌──────────────┐ ┌───────────────┐ ┌──────────────┐              │
│  │ Data / Ctx   │ │ ML Platform   │ │ Policy       │              │
│  │ Ingestion    │ │ (model dev)   │ │ Evaluation   │              │
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

### Gateway Boundary — Intelligence vs. Product Backend

The AI platform governs **intelligence operations** — agent invocations, knowledge queries, analytical reasoning, decisions, actions with provenance, and governed tool execution. It does NOT need to be the backend for every product operation.

```
            PRODUCT
        ┌──────┴──────┐
        │             │
        ▼             ▼
Product Backend   AI Platform
   APIs              APIs
    │                 │
    ▼                 ▼
Operational       Intelligence
Systems            Gateway
```

Ordinary product operations (edit profile, upload file, change password) flow through the product's own backend. Intelligence operations (ask a question, run an agent, query metrics, execute a governed action, retrieve knowledge) flow through the Intelligence Gateway.

**The distinction matters.** Without it, the AI platform accidentally becomes a universal application backend — a much larger and less focused problem.

### AI / Intelligence Gateway

The governed entry point for all **intelligence operations**. Every request that involves AI reasoning, knowledge retrieval, analytics, governed actions, or agent execution passes through this gateway.

**Responsibilities:**
- Authenticate the requesting identity (user, service, agent)
- Resolve authorization — what can this identity do?
- Enforce rate limits and cost budgets
- Apply governance policies (data classification, compliance rules)
- Route to appropriate agent or service
- Enforce tenant and product isolation
- Produce audit records for every request

**Key principle:** No intelligence operation bypasses the gateway. If it's not authorized, it doesn't execute. Ordinary product CRUD that does not involve intelligence capabilities does not need to flow through this gateway.

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

2. **Durable Workflow Runtime** — persistent, deterministic replay
   - Long-running business processes
   - Human approval waits (via signals)
   - Scheduled operations
   - Retry logic with compensation (Activities are at-least-once; must be idempotent)
   - State that survives system restarts
   - Persisted workflow state with deterministic replay

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

1. **Product agnosticism** — the core platform contains zero domain-specific logic; all domain knowledge enters through extension mechanisms (domain packages, ontology definitions, semantic models, tools, policies, agents, workflows, connectors)
2. **Gateway-mediated access** — no component bypasses the intelligence gateway
3. **Ontology-first operations** — agents operate on domain abstractions, not raw data
4. **Identity delegation** — agent permissions are bounded by user permissions
5. **Temporal awareness** — the system knows not just what is true, but what was true and when things changed
6. **Provenance by default** — every output carries its evidence chain
7. **Separation of reasoning and durability** — ephemeral agent thinking vs. persistent business workflows
8. **Metrics consistency** — one definition of each metric, everywhere
9. **Model independence** — any LLM can be swapped without architectural change
10. **Protocol-first integration** — MCP for tool access, A2A for agent communication
11. **Least privilege** — every component operates with minimum necessary permissions
12. **Enterprise-grade abstractions, simple implementation** — predictable contracts, isolation, governance, security, lifecycle management, observability from the beginning; microservices only when justified

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

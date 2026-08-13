# Build vs. Adopt Analysis

> STATUS: IN RESEARCH
> Last updated: 2026-08-13

## Decision Framework

| Strategy | When to Use |
|----------|-------------|
| **Adopt** | Existing OSS solves the problem well; no significant modification needed |
| **Wrap** | OSS is useful but should sit behind our interfaces for flexibility |
| **Extend** | OSS solves part of the problem; needs additional capability |
| **Build** | Strategically important IP, or existing solutions are inadequate |

---

## Capability-Level Analysis

### Experience Layer
**Recommendation: BUILD**
The experience layer is product-defining. It determines how users interact with the platform. No generic OSS UI framework captures the platform's unique value proposition.

### AI Gateway
**Recommendation: BUILD (wrapping components)**
No existing OSS project provides a complete AI gateway with identity, authorization, budgets, governance, and routing. Build by composing: LiteLLM for model routing, OpenFGA for authorization, custom logic for budget/governance.

### Identity & Authorization
**Recommendation: ADOPT OpenFGA + BUILD delegation layer**
OpenFGA provides excellent ReBAC. The agent delegation layer (user → agent → tool permission propagation) must be built — no OSS project solves this well.

### Model Gateway
**Recommendation: WRAP LiteLLM**
LiteLLM provides strong provider abstraction. Wrap with platform-specific routing, tenant isolation, and budget logic.

### Agent Runtime
**Recommendation: WRAP (LangGraph or Agno)**
Adopt a runtime and wrap with platform-specific tool/auth/observability integration. NEEDS DEEPER EVALUATION to select between candidates.

### Agent Registry
**Recommendation: BUILD**
No strong standalone OSS exists. Build as part of the control plane.

### Tool Registry
**Recommendation: BUILD on MCP**
Adopt MCP as the tool interface standard. Build the governance layer (authorization, rate limiting, audit).

### MCP / A2A Gateway
**Recommendation: ADOPT protocols + BUILD gateway**
Adopt MCP and A2A protocol specifications. Build the governance gateway that mediates access.

### Domain Ontology
**Recommendation: BUILD — core IP**
The ontology compiler, domain model definition, and ontology-to-agent compilation are strategically important. Study Palantir, TypeDB, and Semantica for concepts. Implement independently.

### Semantic Metrics Layer
**Recommendation: WRAP Cube**
Cube is production-ready and well-aligned. Wrap with ontology integration and platform-specific security context.

### Context Graph
**Recommendation: BUILD (inspired by Graphiti)**
Temporal knowledge graph concepts from Graphiti are valuable. Build with platform-specific integration to ontology and event store.

### Knowledge Engine
**Recommendation: ADOPT vector DB + BUILD pipeline**
Adopt a vector database (evaluate LanceDB, pgvector, Qdrant). Build the ingestion, chunking, and retrieval orchestration pipeline.

### Retrieval Engine
**Recommendation: BUILD**
Cross-source retrieval orchestration (vector + graph + structured) is platform-specific.

### Analytical Engine
**Recommendation: ADOPT ClickHouse (or DuckDB for embedded)**
Both are production-ready. Adopt based on workload requirements.

### Event Intelligence
**Recommendation: BUILD on adopted analytical engine**
Event storage via ClickHouse; build pattern detection and causal analysis.

### Decision Intelligence
**Recommendation: BUILD — core IP**
No mature OSS exists. Decision objects, provenance, outcome learning, and causal reasoning are a key differentiator.

### Action Engine
**Recommendation: BUILD**
Action governance (authorization, validation, audit, side effects) is security-critical and platform-specific.

### Human Approval
**Recommendation: BUILD on adopted workflow engine**
Build approval workflows using Temporal/Inngest as the durable execution substrate.

### Durable Workflow Engine
**Recommendation: ADOPT Temporal (or Inngest for simpler needs)**
Both are production-ready. Temporal for complex workflows; Inngest for simpler event-driven patterns.

### Memory
**Recommendation: BUILD on context graph**
Agent memory should be a view over the context graph, not a separate system.

### Metadata / Governance
**Recommendation: WRAP DataHub**
DataHub provides strong metadata graph capabilities. Wrap with platform ontology integration.

### Observability
**Recommendation: ADOPT OTel + WRAP Langfuse**
OpenTelemetry as foundation; Langfuse for AI-specific observability.

### Evaluation
**Recommendation: ADOPT Langfuse/MLflow + BUILD domain-specific criteria**
Framework from existing tools; domain-specific evaluation criteria are custom.

### Cost / Metering
**Recommendation: WRAP LiteLLM cost tracking + BUILD platform metering**
LiteLLM tracks token costs; build budget/allocation/alerting logic.

### Deployment
**Recommendation: ADOPT standard tooling (Kubernetes, containers)**
Well-established patterns.

### Developer Platform
**Recommendation: BUILD**
Product surface — SDKs, APIs, documentation, development workflows.

---

## Potential Proprietary Value Areas

These are areas where building may create defensible IP:

| Area | Why It May Be Valuable | Confidence |
|------|----------------------|------------|
| Ontology compiler | No OSS equivalent; Palantir-like domain abstraction | Medium-High |
| Cross-domain semantic abstraction | Unifying ontology + semantic layer + context graph | Medium |
| Decision intelligence | First-class decision objects with provenance | Medium |
| Outcome learning | Situation → intervention → outcome learning loops | Medium |
| Insight generation | Domain-aware intelligence synthesis | Medium |
| Action governance | Authorization + validation + audit for AI actions | High |
| Ontology-to-agent compilation | Generating agent tools/capabilities from ontology definitions | Medium-High |

**WARNING:** These are hypotheses, not conclusions. Each requires validation through prototyping and market research before committing significant development resources.

---

## Summary

| Strategy | Count | Examples |
|----------|-------|---------|
| Adopt | 5 | OpenFGA, ClickHouse/DuckDB, Temporal/Inngest, OTel, Kubernetes |
| Wrap | 5 | LiteLLM, Cube, Langfuse, DataHub, agent runtime |
| Build | 11 | Ontology, decision intelligence, action engine, AI gateway, experience layer, etc. |

The platform is primarily a **build** project with strategic adoption of proven infrastructure. The build areas concentrate in the intelligence/domain layer and the governance layer — where the platform's unique value resides.

# Architecture Spikes

## Purpose

Architecture spikes are **time-boxed investigations** that test hypotheses before they become architecture decisions. They are exploratory by nature — designed to reduce uncertainty, expose risks, and generate evidence.

**No spike automatically becomes a decision.** Each spike that produces actionable findings must result in a separate Architecture Decision Record (ADR). The spike provides evidence; the ADR records the decision.

## Development Model

The research phase has concluded. The architecture is now strong enough to test empirically.

```
              ┌───────────────┐
              │ Architecture  │
              │ Hypothesis    │
              └───────┬───────┘
                      ↓
              ┌───────────────┐
              │     SPIKE     │
              └───────┬───────┘
                      ↓
          ┌───────────┴────────────┐
          ↓                        ↓
      SURVIVES                  FAILS
          │                        │
          ↓                        ↓
      ADR candidate          Change architecture
          │                        │
          └────────────┬───────────┘
                       ↓
                 Next spike
```

**From this point forward:**
- Prefer empirical findings from prototypes over adding new abstractions
- Every spike should attempt to falsify the architecture hypothesis
- Every spike should produce evidence suitable for an ADR
- Do not add broad conceptual layers unless a spike exposes a genuine missing abstraction

## Prioritized Execution Order

Spikes are prioritized to test the **unique IP hypothesis before validating commodity infrastructure**.

### Priority 1 — Core IP Validation (tests Intelligence-as-Code thesis)

| Order | Spike | Tests |
|-------|-------|-------|
| 1st | 008: Domain Definition IR Compiler | Can we express fundamentally different domains in a composed IR? |
| 2nd | 011: Domain Package Four-Domain Validation | Can four architecturally distinct domains operate without core changes? |
| 3rd | 004: Authorization/Delegation/ScopeContext | Does enterprise governance work across delegation modes and scope levels? |
| 4th | 012: Package Lifecycle and Versioning | Can Intelligence-as-Code evolve safely? |

### Priority 2 — Infrastructure Validation

| Order | Spike | Tests |
|-------|-------|-------|
| 5th | 001: PostgreSQL + AGE + pgvector | Does the infrastructure simplification actually work? |
| 6th | 005: Agno vs LangGraph | Which agent runtime fits the platform model? |
| 7th | 003: Cube Adapter | Can semantic models compile from IR to Cube? |
| 8th | 006: Temporal Integration | How do durable workflows integrate with agent execution? |
| 9th | 007: MCP Governance Gateway | Can tool access be governed through the platform model? |
| 10th | 010: Multi-Tenant Isolation | Does tenant isolation hold under realistic load? |

### Deferred (Run If Needed)

| Spike | Condition |
|-------|-----------|
| 002: Graphiti + AGE | Run if spike 001 validates AGE |
| 009: Cross-Source Retrieval | Run when knowledge architecture is validated |

## When to Create a Spike

- When a technology choice involves significant uncertainty
- When integration between components has not been proven
- When performance, security, or operational characteristics are unknown
- When the team disagrees and needs empirical evidence

## Spike Lifecycle

1. **NOT STARTED** — Spike is defined but work has not begun
2. **IN PROGRESS** — Active investigation and prototyping
3. **COMPLETED** — Results documented, recommendation made
4. **SUPERSEDED** — A newer spike replaces this investigation
5. **ABANDONED** — Investigation was cancelled (document why)

## Prototype Code

Spike prototype code is stored in `spikes/prototypes/NNN-spike-name/`. Each prototype is self-contained and disposable — spike code is evidence, not product code.

## Spike Template Structure

Every spike document follows this structure:

```markdown
# Spike NNN: Title

**Status:** NOT STARTED | IN PROGRESS | COMPLETED | SUPERSEDED | ABANDONED
**Time-box:** [estimated duration]
**Author:** [name]
**Date:** [creation date]

## Question

What specific question are we trying to answer?

## Hypothesis

What do we believe the answer is, and why?

## Prototype Plan

What will we build or test to validate/invalidate the hypothesis?

## Test Methodology

How will we evaluate the results? What metrics matter?

## Results

PENDING — Results will be documented here when the spike is completed.

## Failure Modes

What failure scenarios did we discover or anticipate?

## Operational Findings

What did we learn about deployment, monitoring, maintenance, and day-to-day operations?

## Security Findings

What security implications, risks, or requirements did we discover?

## Performance Findings

What did we learn about latency, throughput, resource usage, and scalability?

## Conclusion

What did we learn? Was the hypothesis validated or invalidated?

## Recommendation

What do we recommend based on these findings?

## Confidence Level

How confident are we in this recommendation? (Low / Medium / High)
What would increase our confidence?
```

## Index of Spikes

| # | Spike | Status | Priority |
|---|-------|--------|----------|
| 001 | [PostgreSQL + AGE + pgvector Unified Data Layer](./001-postgres-age-pgvector.md) | NOT STARTED | P2 (5th) |
| 002 | [Graphiti + Apache AGE Compatibility](./002-graphiti-age-compatibility.md) | NOT STARTED | Deferred |
| 003 | [Cube Ontology Integration](./003-cube-ontology-integration.md) | NOT STARTED | P2 (7th) |
| 004 | [OpenFGA Agent Delegation + ScopeContext](./004-openfga-agent-delegation.md) | NOT STARTED | P1 (3rd) |
| 005 | [Agno vs LangGraph Agent Runtime](./005-agno-vs-langgraph.md) | NOT STARTED | P2 (6th) |
| 006 | [Temporal + Agent Workflow Integration](./006-temporal-agent-workflow-integration.md) | NOT STARTED | P2 (8th) |
| 007 | [MCP Governance Gateway](./007-mcp-governance-gateway.md) | NOT STARTED | P2 (9th) |
| 008 | [Domain Definition IR Compiler](./008-ontology-ir-compiler.md) | NOT STARTED | P1 (1st) |
| 009 | [Cross-Source Retrieval Orchestration](./009-cross-source-retrieval.md) | NOT STARTED | Deferred |
| 010 | [Multi-Tenant Isolation Testing](./010-multi-tenant-isolation.md) | NOT STARTED | P2 (10th) |
| 011 | [Domain Package Validation — Four-Domain Test](./011-domain-package-validation.md) | NOT STARTED | P1 (2nd) |
| 012 | [Package Lifecycle and Versioning](./012-package-lifecycle-versioning.md) | NOT STARTED | P1 (4th) |

# Architecture Spikes

## Purpose

Architecture spikes are **time-boxed investigations** that test hypotheses before they become architecture decisions. They are exploratory by nature — designed to reduce uncertainty, expose risks, and generate evidence.

**No spike automatically becomes a decision.** Each spike that produces actionable findings must result in a separate Architecture Decision Record (ADR). The spike provides evidence; the ADR records the decision.

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

| # | Spike | Status |
|---|-------|--------|
| 001 | [PostgreSQL + AGE + pgvector Unified Data Layer](./001-postgres-age-pgvector.md) | NOT STARTED |
| 002 | [Graphiti + Apache AGE Compatibility](./002-graphiti-age-compatibility.md) | NOT STARTED |
| 003 | [Cube Ontology Integration](./003-cube-ontology-integration.md) | NOT STARTED |
| 004 | [OpenFGA Agent Delegation Model](./004-openfga-agent-delegation.md) | NOT STARTED |
| 005 | [Agno vs LangGraph Agent Runtime](./005-agno-vs-langgraph.md) | NOT STARTED |
| 006 | [Temporal + Agent Workflow Integration](./006-temporal-agent-workflow-integration.md) | NOT STARTED |
| 007 | [MCP Governance Gateway](./007-mcp-governance-gateway.md) | NOT STARTED |
| 008 | [Ontology IR Compiler](./008-ontology-ir-compiler.md) | NOT STARTED |
| 009 | [Cross-Source Retrieval Orchestration](./009-cross-source-retrieval.md) | NOT STARTED |
| 010 | [Multi-Tenant Isolation Testing](./010-multi-tenant-isolation.md) | NOT STARTED |
| 011 | [Domain Package Validation — Two-Domain Test](./011-domain-package-validation.md) | NOT STARTED |

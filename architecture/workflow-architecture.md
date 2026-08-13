# Workflow Architecture

> STATUS: NOT STARTED
> Last updated: 2026-08-13

## Two Kinds of Workflows

### Agent Reasoning Workflows (Ephemeral)
How an agent thinks — tool selection, multi-step reasoning, context assembly. Managed by the agent runtime (LangGraph, Agno, etc.).

- Short-lived (seconds to minutes)
- Restartable from checkpoints
- No durability guarantees needed
- Graph-based (nodes = reasoning steps)

### Durable Business Workflows (Persistent)
How business processes execute — approval chains, data pipelines, scheduled operations. Managed by a workflow engine (Temporal, Inngest, etc.).

- Long-lived (minutes to weeks)
- Survives failures, restarts, deployments
- Exactly-once execution guarantees
- Supports human wait points
- Deterministic replay for recovery

### The Anti-Pattern

Do NOT try to make the agent reasoning runtime handle durable workflows, or make the workflow engine manage agent reasoning. They have fundamentally different requirements.

```
WRONG:  Agent runtime handling 3-day approval wait
RIGHT:  Durable workflow calls agent reasoning as an activity step
```

## Temporal vs. Inngest vs. Restate

| Capability | Temporal | Inngest | Restate |
|-----------|----------|---------|---------|
| Durability | Full deterministic replay | Step-based checkpointing | Journal-based replay |
| Complexity | High (SDKs, workers, server) | Low (event-driven functions) | Medium (virtual objects) |
| Human waits | Signals | Sleep + event resume | Virtual object state |
| Scaling | Proven at massive scale | Simpler scaling model | Emerging |
| Self-hosting | Yes (complex) | Yes | Yes |
| Maturity | Production-proven | Production-ready | Newer |

## Research Questions

- Is Temporal's complexity justified for the platform's needs?
- Could Inngest serve as a simpler starting point?
- How do workflow states interact with the event store?
- How does workflow authorization work?

## References

- `open-source/workflows/temporal.md` — Temporal research
- `open-source/workflows/inngest.md` — Inngest research
- `open-source/workflows/restate.md` — Restate research

# Workflow Architecture

> STATUS: DEEP REVIEW COMPLETE
> Last updated: 2026-08-13

## Two Kinds of Workflows

### Agent Reasoning Workflows (Ephemeral)
How an agent thinks — tool selection, multi-step reasoning, context assembly. Managed by the agent runtime (LangGraph, Agno, etc.).

- Short-lived (seconds to minutes)
- Restartable from checkpoints
- No durability guarantees needed
- Graph-based (nodes = reasoning steps)

### Durable Business Workflows (Persistent)
How business processes execute — approval chains, data pipelines, scheduled operations. Managed by a workflow engine (Temporal).

- Long-lived (minutes to weeks)
- Survives failures, restarts, deployments
- **Deterministic Workflow replay** — Workflow code is deterministic and replayed from event history
- **At-least-once Activity execution** — Activities (side effects) are retried on failure and must be designed for idempotency
- Supports human wait points via signals
- Persisted workflow state

### Temporal's Actual Guarantees (Corrected)

Previous documentation incorrectly claimed "exactly-once execution guarantees." This is imprecise.

**What Temporal guarantees:**
- Workflow code executes deterministically via replay — the same inputs always produce the same workflow logic
- Workflow state is persisted and survives process crashes, server restarts, and deployments
- Activities are retried until success (at-least-once by default)
- Timer-based scheduling survives failures

**What Temporal does NOT guarantee:**
- Activities are NOT exactly-once. If an Activity calls an external API, the API call may execute more than once due to retries
- Side effects in Activities must be idempotent — sending money, deleting resources, sending messages, approving transactions, issuing documents must handle duplicate execution

**Idempotency requirements for high-impact actions:**
```
send_payment()     → use idempotency key with payment provider
delete_resource()  → check if already deleted before acting
send_notification()→ deduplicate by message ID
approve_request()  → check if already approved
issue_document()   → check if already issued
```

### The Anti-Pattern

Do NOT try to make the agent reasoning runtime handle durable workflows, or make the workflow engine manage agent reasoning. They have fundamentally different requirements.

```
WRONG:  Agent runtime handling 3-day approval wait
RIGHT:  Durable workflow calls agent reasoning as an activity step
```

## Workflow Engine Decision

| Engine | License | Status | Reason |
|--------|---------|--------|--------|
| **Temporal** | MIT | CANDIDATE | Only viable open-source durable workflow engine. Operationally complex but architecturally sound. |
| Inngest | SSPL | EXCLUDED | Cannot use in SaaS without full source disclosure of entire service stack. |
| Restate | BSL 1.1 | EXCLUDED | NOT open source until conversion date (typically 4 years after release). Commercial use restricted. |

### Temporal Comparison Detail

| Capability | Temporal |
|-----------|----------|
| Durability | Full deterministic replay from event history |
| Complexity | High (SDKs, workers, server, Elasticsearch/visibility store) |
| Human waits | Signals and queries |
| Scaling | Proven at massive scale (Uber, Netflix, Snap, Stripe) |
| Self-hosting | Yes (requires: server, frontend, matching, history, worker services, PostgreSQL/MySQL/Cassandra, Elasticsearch) |
| Maturity | Production-proven at scale |
| Activity semantics | At-least-once with configurable retry policies |
| Compensation | Saga pattern support via workflow logic |
| Idempotency | Must be implemented at Activity level |

## Research Questions

- What is the minimum viable self-hosted Temporal deployment? (Single binary mode vs. full cluster)
- How do workflow states interact with the event store?
- How does workflow authorization work? (Temporal namespaces + platform-level authorization)
- What is the operational burden of Temporal in production? (Monitoring, upgrades, scaling)

## References

- `open-source/workflows/temporal.md` — Temporal research
- `open-source/workflows/inngest.md` — Inngest research (EXCLUDED — SSPL)
- `open-source/workflows/restate.md` — Restate research (EXCLUDED — BSL)
- `architecture/spikes/006-temporal-agent-workflow-integration.md` — Validation spike

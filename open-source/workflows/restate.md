# Restate (restatedev/restate)

**STATUS: NOT STARTED**
**License:** Varies by component (NEEDS VERIFICATION)
**Repository:** https://github.com/restatedev/restate
**SDKs:** TypeScript, Java, Kotlin, Python, Go, Rust

---

## Overview

Restate is a durable execution platform distributed as a single self-contained
binary with no external dependencies. It provides durable functions, virtual
objects, and workflows with a lighter operational footprint than Temporal.

---

## Core Concepts

### Durable Functions

Every `ctx.run(...)` call is journaled. If the function crashes, Restate replays
the journal, skipping completed steps and resuming from where it left off.
Failed steps are retried automatically.

### Virtual Objects

The distinguishing feature. Virtual objects are durable, stateful entities
keyed by an identifier:
- Per-key application state is consistent and serialized
- No need for a separate lock service or transactional outbox
- Concurrent modifications to the same key are serialized automatically
- State persists across invocations

Use cases: user sessions, shopping carts, agent sessions keyed by user ID.

### Keyed State

State is partitioned by the virtual object key. The target partition is
determined by hashing the virtual object key, workflow ID, or idempotency
key. This enables horizontal scaling with consistent state routing.

### Journal-Based Replay

The replay mechanism:
1. Every `ctx.run()` call records its result to a persistent journal
2. On recovery, the journal is replayed deterministically
3. Completed steps return their recorded results
4. Execution continues from the last incomplete step

Similar in principle to Temporal's event-sourced history but with a lighter
implementation.

---

## Agent-Specific Patterns

Recent (2025-2026) focus on agent workloads:
- Each agent session is a virtual object, keyed by user or session ID
- Tool calls within a session are deduplicated by the journal automatically
- Durable agent loops: fault tolerance across agent frameworks without lock-in
- Awakeable + durable promises for human-in-the-loop patterns

---

## Operational Advantages

- **Single binary:** No database, no cluster, no external dependencies
- **Low footprint:** Simpler to operate than Temporal
- **Horizontal scaling:** Add more Restate nodes as needed
- **No workflow server:** Restate acts as a sidecar/proxy, not a separate
  orchestration server

---

## Key Questions

- [ ] How mature is Restate for production workloads compared to Temporal?
- [ ] What are the scale limits of the single-binary architecture?
- [ ] How does virtual object state interact with multi-tenancy?
- [ ] What is the community size and ecosystem maturity?
- [ ] How does Restate handle long-running workflows (days/weeks)?

---

## References

- Restate Documentation: https://docs.restate.dev
- Key Concepts: https://docs.restate.dev/foundations/key-concepts
- Restate GitHub: https://github.com/restatedev/restate
- Durable Execution Guide: https://restate.dev/what-is-durable-execution

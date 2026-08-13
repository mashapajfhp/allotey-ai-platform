# Temporal (temporalio/temporal)

**STATUS: RESEARCH COMPLETE**
**License:** MIT
**Repository:** https://github.com/temporalio/temporal
**SDKs:** Go, Java, Python, TypeScript, .NET, PHP, Ruby (as of Q2 2026)

---

## Overview

Temporal is a durable execution platform that allows developers to write long-running,
fault-tolerant workflows as ordinary code. Founded in 2019 by the team that built
Uber's Cadence orchestrator. It is the industry standard for mission-critical
workflow orchestration, used by Stripe, Netflix, Snap, and Datadog.

The core insight: instead of building state machines, message queues, and retry
logic, write your business process as a function. Temporal makes it durable.

---

## Core Concepts

### Workflows

A workflow is a function that orchestrates a business process. It must be
deterministic -- given the same inputs and event history, it must produce the
same sequence of commands. This is what enables replay.

Key properties:
- Can run for seconds, days, or months
- Survives process crashes, server restarts, infrastructure failures
- Has an identity (Workflow ID) for deduplication and interaction
- Maintains internal state that persists across failures
- Can spawn child workflows for decomposition

### Activities

Activities are where real-world side effects happen:
- API calls, database writes, file uploads, sending emails
- LLM invocations, tool calls, external service interactions
- Anything non-deterministic or with side effects

Activities execute outside the replay path and are automatically retried on
failure. They are the boundary between the deterministic workflow and the
non-deterministic outside world.

### Deterministic Replay

The mechanism that makes everything work:
1. Workflow code executes and makes decisions (call activity, start timer, etc.)
2. Each decision is logged to the workflow's event history
3. If the workflow crashes and restarts, the history is replayed
4. During replay, completed steps return their recorded results (no re-execution)
5. Execution continues from where it left off

This means: workflow code must be deterministic. No random(), no Date.now(),
no direct API calls. All non-deterministic operations go in Activities.

---

## Interaction Primitives

### Signals

Push data into a running workflow from the outside:
- "Approve this request"
- "Payment confirmed"
- "User uploaded document"

Signals are durable -- they survive crashes and are replayed correctly.

### Queries

Read-only inspection of a running workflow's state:
- "What step is this workflow on?"
- "How many items have been processed?"
- "What is the current approval status?"

Queries do not modify workflow state and do not appear in the event history.

### Updates (newer primitive)

Combine signal + query: send data to a workflow and get a response back in
a single round trip. Useful for request-response patterns within a running
workflow.

---

## Durable Patterns

### Durable Timers

Workflows can sleep for seconds or months. Timers persist through Worker or
platform downtime. A single Worker can support millions of timers because
sleeping is resource-light -- the workflow is not actively consuming compute.

### Retry Policies

Activities have configurable retry policies:
- Initial interval, backoff coefficient, maximum interval
- Maximum attempts
- Non-retryable error types
- Exponential backoff by default

Best practice: retry Activities rather than restart entire workflows.

### Idempotency

Practical pattern: derive an idempotency key from stable identifiers (often
combining Workflow Run ID + Activity ID). External services receive this key
and can safely handle retried Activity calls without duplicating side effects.

### Saga Pattern (Compensating Transactions)

For distributed transactions across multiple services:
1. Define a forward action and its compensating action for each step
2. If a downstream step fails, compensating actions execute in reverse order
3. Compensation is defined in workflow code and executed automatically
4. The workflow is the authoritative state machine for the business process

---

## Human-in-the-Loop

Temporal excels at human-in-the-loop workflows:

1. Workflow reaches a decision point requiring human input
2. Workflow calls `workflow.await(signal)` -- durably sleeps until signal arrives
3. External system (UI, email, Slack) sends a Signal when human decides
4. Timer-based escalation fires if signal is not received within a window
5. Workflow resumes from exactly where it stopped

This pattern is fully durable -- if the system crashes while waiting for
human input (which could take days), it resumes correctly after restart.

---

## The Critical Distinction: Agent Runtime vs Business Process Runtime

This is the most important architectural decision for an AI platform:

### Agent Reasoning Runtime (NOT Temporal)

The LLM's reasoning loop -- observe, think, act, observe again -- is:
- Latency-sensitive (users waiting for responses)
- Stateless per invocation (context window is the state)
- Short-lived (seconds to minutes)
- Does not need durable replay (if it fails, retry the whole inference)
- Managed by the agent framework (LangGraph, CrewAI, custom)

Temporal is the WRONG tool for this. Wrapping each LLM call in a Temporal
Activity adds overhead and complexity without benefit. The agent framework
handles the reasoning loop.

### Business Process Runtime (Temporal's Sweet Spot)

The durable, long-running business process that an agent participates in:
- Customer onboarding (days/weeks, multiple human approvals)
- Document processing pipeline (ingest, extract, validate, approve, archive)
- Multi-step data migration with rollback
- Scheduled report generation with error handling
- Payment processing with saga compensation

Temporal orchestrates the overall process. An agent might be called as an
Activity within a Temporal workflow (e.g., "call the extraction agent to
process this document"), but the agent's internal reasoning is not managed
by Temporal.

### The Boundary

```
Temporal Workflow (durable, long-running)
  |
  +-- Activity: Call extraction agent
  |     |
  |     +-- [Agent framework handles reasoning loop internally]
  |     +-- Returns extracted data
  |
  +-- Activity: Validate extracted data
  +-- Signal: Wait for human approval
  +-- Activity: Call classification agent
  +-- Activity: Store results
```

The agent is a black box to Temporal. Temporal ensures the overall process
completes. The agent framework ensures the reasoning is correct.

---

## Comparison: Temporal vs Inngest vs Restate

| Dimension | Temporal | Inngest | Restate |
|-----------|----------|---------|---------|
| **Model** | Workflow + Activity functions | Event-driven step functions | Durable services + virtual objects |
| **Maturity** | Most mature, production-proven at scale | Growing, strong DX | Newest, innovative architecture |
| **Operational Complexity** | High (server cluster, DB, workers) | Low (managed service or self-host) | Low (single binary, no external deps) |
| **Language Support** | 7 SDKs (Go, Java, Python, TS, .NET, PHP, Ruby) | TypeScript, Python, Go | TypeScript, Java, Kotlin, Python, Go, Rust |
| **Determinism Requirement** | Strict (workflow code must be deterministic) | Relaxed (steps are checkpointed) | Moderate (journal-based) |
| **State Model** | Event-sourced history | Step-level memoization | Per-key state in virtual objects |
| **Human-in-the-Loop** | Signals + durable timers (excellent) | Step.waitForEvent | Awakeable + durable promises |
| **Scaling** | Proven at massive scale (Stripe, Netflix) | Growing, serverless-friendly | Single binary, horizontal scaling |
| **License** | MIT | SSPL (NEEDS VERIFICATION) | Varies by component |
| **Best For** | Mission-critical, long-running, complex | Serverless, event-driven, simpler | Stateful services, low-ops |

### When to Choose Temporal

- Mission-critical business processes that cannot fail
- Long-running workflows (days/weeks/months)
- Complex orchestration with many steps and decision points
- Saga patterns with compensating transactions
- Team has the operational capacity to run Temporal infrastructure
- Need proven scale (billions of workflow executions)

### When to Consider Inngest

- Simpler workflows triggered by events
- Serverless deployment model preferred
- Lower operational overhead required
- Team wants faster time-to-value

### When to Consider Restate

- Stateful services (virtual objects with per-key state)
- Want durable execution without the Temporal programming model
- Low operational footprint is critical (single binary)
- Building event-driven microservices that need durability

---

## Deployment and Operations

### Components

- **Temporal Server:** Cluster of services (frontend, history, matching, worker)
- **Database:** PostgreSQL, MySQL, or Cassandra for persistence
- **Workers:** Application code that hosts workflow and activity implementations
- **Temporal Cloud:** Managed service (eliminates server operations)

### Operational Considerations

Temporal has the highest operational complexity of the three options. Running
it in production requires:
- Database management and tuning
- Server cluster management
- Monitoring and alerting
- Version management for workflow definitions (versioning/patching)
- Worker fleet management

Temporal Cloud eliminates server-side operations but adds vendor dependency.

---

## Key Questions for Platform Design

- [ ] Where is the boundary between agent reasoning and business process?
- [ ] Should we start with Inngest/Restate for simplicity and migrate to
      Temporal if needed, or invest in Temporal from the start?
- [ ] Temporal Cloud vs self-hosted? What are the cost implications?
- [ ] How to handle workflow versioning when agent behaviors change?
- [ ] What is the latency overhead of calling an agent as a Temporal Activity?
- [ ] How to model multi-tenant workflow isolation?

---

## References

- Temporal Documentation: https://docs.temporal.io
- Temporal Design Patterns: https://docs.temporal.io/design-patterns
- Human-in-the-Loop: https://temporal.io/blog/human-in-the-loop-approvals
- Workflow Definition: https://docs.temporal.io/workflow-definition
- Temporal vs Inngest: https://www.inngest.com/compare-to-temporal

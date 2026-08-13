# Agent Runtime Architecture

> STATUS: IN RESEARCH
> Last updated: 2026-08-13

## Core Distinction

The platform requires two different runtime concerns that must not be conflated:

### 1. Agent Reasoning Runtime (Ephemeral)

Handles the LLM interaction loop — prompt assembly, tool selection, multi-step reasoning, response generation. Characteristics:
- Stateless between requests (state is externalized to checkpoints/memory)
- Restartable — if reasoning fails, retry from checkpoint
- May run for seconds to minutes
- Graph-based execution (nodes = steps, edges = transitions)
- Supports streaming

**Primary candidates:** LangGraph, Google ADK, Agno, Strands

### 2. Durable Workflow Runtime (Persistent)

Handles long-running business processes — approval chains, multi-step operations, scheduled tasks. Characteristics:
- Durable state — survives crashes, restarts, deployments
- Exactly-once execution guarantees
- May run for hours, days, or weeks
- Supports human wait points
- Deterministic replay for recovery

**Primary candidates:** Temporal, Inngest, Restate

### How They Interact

```
Durable Workflow Step: "Get approval for purchase order"
    │
    ├── Activity 1: Agent Reasoning (ephemeral)
    │   └── Agent assembles context, generates recommendation
    │
    ├── Activity 2: Human Approval (waits indefinitely)
    │   └── Workflow pauses, timer set
    │
    ├── Activity 3: Agent Reasoning (ephemeral)
    │   └── Agent executes approved action
    │
    └── Activity 4: Notification (deterministic)
        └── Send confirmation
```

The durable workflow engine calls the agent reasoning runtime as an activity within a larger workflow.

## Agent Patterns

### Single Agent
One agent, one task, direct tool access. The simplest pattern.

### Multi-Agent Orchestration
Multiple specialized agents coordinated by a supervisor:
- **Supervisor** — routes requests to specialist agents
- **Sequential** — agents execute in order
- **Parallel** — agents execute concurrently, results merged
- **Hierarchical** — agents delegate to sub-agents

### Human-in-the-Loop
Agent pauses execution at defined checkpoints for human review:
- Pre-action approval ("Should I send this email?")
- Mid-workflow review ("Here's my analysis, continue?")
- Exception handling ("I'm uncertain, please decide")

## State Management

Agent state must be externalized, not held in process memory:
- **Session state** — current conversation, assembled context
- **Checkpoint state** — intermediate reasoning results (for restart)
- **Memory state** — long-term learned facts (stored in context graph)
- **Workflow state** — durable business process state (managed by workflow engine)

## Research Questions

- LangGraph vs. Agno vs. Google ADK — which best fits the platform's needs?
- How does multi-agent authorization work? Does each agent in a chain have its own permission set?
- How does agent state checkpointing interact with the context graph?
- What is the right abstraction for tool execution within agents?
- How should agent versioning work? Can agents be A/B tested?

## References

- `open-source/agent-runtime/` — all agent runtime research
- `commercial-platforms/palantir/agents.md` — Palantir's agent model
- `commercial-platforms/databricks/agents.md` — Databricks agent framework

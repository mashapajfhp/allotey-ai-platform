# Microsoft Agent Framework — Research Note

**Repository:** [microsoft/agent-framework](https://github.com/microsoft/agent-framework)
**License:** MIT
**Language:** .NET (C#), Python
**Status:** NOT STARTED — key architecture questions to investigate

---

## Overview

Microsoft Agent Framework reached 1.0 GA in April 2026 with .NET and Python
support. It represents the consolidation of AutoGen and Semantic Kernel into a
single, unified framework. The framework combines AutoGen's simple agent
abstractions with Semantic Kernel's enterprise features — session-based state
management, type safety, middleware, telemetry — and adds graph-based workflows
for explicit multi-agent orchestration.

---

## Architecture

### Merger of AutoGen and Semantic Kernel

Microsoft merged two previously separate projects:
- **AutoGen** — research-originated multi-agent conversation framework with
  simple agent abstractions and dynamic group chat patterns.
- **Semantic Kernel** — enterprise-grade SDK with plugin architecture, planning,
  memory, and deep Azure integration.

The Agent Framework unifies these into a single codebase with consistent APIs
across .NET and Python.

---

## Graph-Based Execution

Workflows orchestrate **executors** in directed graphs:
- Data flows through **edges** connecting processing units.
- Each workflow runs in synchronized **supersteps** until the graph reaches an
  idle state (convergence).
- Superstep execution means all active nodes in a step execute before the next
  step begins, providing deterministic execution semantics.

### Execution Capabilities
- **Conditional routing** — edges can have conditions that determine whether
  data flows through them.
- **Parallel processing** — multiple executors can run concurrently within a
  superstep.
- **Dynamic execution paths** — the graph structure can be modified at runtime
  based on agent decisions.

---

## Multi-Agent Patterns

The framework provides built-in patterns for coordinating multiple AI agents:

### Sequential
Agents execute in a fixed order, each passing results to the next.

### Concurrent
Multiple agents execute simultaneously on the same input.

### Hand-off
An agent explicitly transfers control to another agent, passing conversation
context and state.

### GroupChat
Multiple agents participate in a shared conversation, with a coordinator
managing turn-taking and topic routing.

### Magentic
NEEDS VERIFICATION: What is the "magentic" pattern? This appears to reference
Magentic-One, Microsoft's multi-agent system for complex tasks. Unclear how it
maps to a reusable pattern in the framework.

---

## State Management

- **Session-based state** — each agent session maintains its own state context.
- **Checkpointing** — execution state can be persisted and resumed.
- **Type safety** — state objects are strongly typed (especially in .NET).

---

## Model Providers

Multi-provider support across:
- Azure OpenAI Service
- OpenAI
- Other providers via extensibility points

NEEDS VERIFICATION: How many non-Azure/OpenAI providers are supported out of
the box? Does it integrate with LiteLLM or similar gateways?

---

## Middleware and Telemetry

The Semantic Kernel heritage brings:
- **Middleware pipeline** — request/response interceptors for logging, caching,
  retry, rate limiting.
- **Telemetry** — built-in OpenTelemetry support for tracing and metrics.
- **Azure AI Foundry integration** — observability and responsible AI features
  for Azure-hosted deployments.

---

## Protocol Support

- **MCP** — Model Context Protocol for tool access.
- **A2A** — Agent-to-Agent protocol for cross-framework communication.

---

## Human-in-the-Loop

The framework supports checkpointing and human-in-the-loop interactions,
allowing workflows to pause for human review, approval, or correction before
continuing execution.

---

## Production Architecture

### Enterprise Integration
The framework integrates with Azure AI Foundry for:
- Deployment management.
- Responsible AI guardrails.
- Observability and monitoring.
- Model management and versioning.

### Workflow Design
Graph-based workflows provide explicit orchestration that is inspectable and
auditable, compared to purely prompt-driven multi-agent conversations.

---

## Key Architecture Questions to Investigate

- [ ] How does the superstep execution model compare to LangGraph's
      node-by-node execution? What are the trade-offs?
- [ ] What is the Python SDK's maturity relative to .NET? Is Python a
      first-class citizen or a port?
- [ ] How tightly coupled is the framework to Azure? Can it run fully
      self-hosted without Azure dependencies?
- [ ] What is the migration path from existing AutoGen or Semantic Kernel
      projects?
- [ ] How does the GroupChat pattern handle scaling — what happens with 10+
      agents in a single group?
- [ ] What is the actual developer adoption so far? GitHub stars, community
      activity?
- [ ] How does the middleware pipeline compare to LiteLLM's gateway approach
      for concerns like rate limiting and cost tracking?
- [ ] What is the state persistence story for long-running workflows (hours,
      days)?

---

## Relevance to Allotey AI Platform

Microsoft Agent Framework is the most enterprise-oriented option in this
research set. The superstep execution model, strong typing, and Azure
integration make it compelling for enterprise deployments. The MIT license is
favorable. The main concern is potential tight coupling to the Azure ecosystem
and whether the Python SDK is truly first-class.

---

*Last updated: 2026-08-13*
*STATUS: NOT STARTED — notes from initial web research only*

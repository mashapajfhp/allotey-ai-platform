# Compozy — Research Note

**Repository:** [compozy/compozy](https://github.com/compozy/compozy)
**License:** NEEDS VERIFICATION
**Language:** Go (runtime), with web UI
**Website:** [compozy.com](https://www.compozy.com/)
**Version:** v0.3 (beta)
**Status:** NOT STARTED — early-stage project, architectural study

---

## Overview

Compozy is an open-source operating system for AI agents that orchestrates
existing agent CLIs (Claude Code, Codex, Gemini CLI, Cursor, and 23+ others)
into a coordinated team. Rather than replacing agent tools, Compozy sits above
them as a control plane — splitting work, managing handoffs, running
automation, and sharing project memory.

---

## Control-Plane Architecture

Compozy's core design principle is that it does not implement agents itself.
Instead, it orchestrates existing agent implementations through their CLIs:

- **Agent-agnostic** — any CLI-based agent can be plugged in.
- **Built-in integrations** — Claude Code, OpenClaw, Hermes, and 23+ more.
- **Uniform interface** — all agents are managed through the same control plane
  regardless of their underlying implementation.

This is architecturally distinct from frameworks like LangGraph or Agno that
provide their own agent runtime. Compozy is purely an orchestration layer.

---

## Runtime-Owned State

The runtime uses one Go binary and SQLite-backed stores to keep all state on
the operator's machine:

- **Loops** — iterative agent execution cycles.
- **Approvals** — human-in-the-loop decision points.
- **Memory** — shared project context across agents.
- **Run history** — complete execution logs.

All of these are core objects in one unified runtime, accessible from multiple
interfaces.

---

## Approvals

Human approval is a first-class primitive, not an afterthought:
- Agents can be configured to require approval before executing certain actions.
- Approval requests are surfaced through the web UI, CLI, or external channels.
- The runtime enforces approval gates — agents cannot proceed without explicit
  authorization.

NEEDS VERIFICATION: What approval channels are supported — web UI only, or
also Slack, email, mobile?

---

## Tools

Agents access tools through the control plane:
- Native tools provided by the Compozy runtime.
- MCP servers connected to the runtime.
- Tools from the underlying agent CLIs.

NEEDS VERIFICATION: How does tool access governance work — can Compozy restrict
which tools an agent can use?

---

## Session Management

Sessions represent a unit of agent work:
- Each session has a defined scope, context, and agent assignment.
- Sessions can be ephemeral (one-off tasks) or long-running.
- Session state is persisted in SQLite.

---

## Memory Architecture

Memory in Compozy is not a vector database. Instead, it uses a directory of
typed Markdown files:

- Agents read memory files on session start.
- Agents update memory through the same CLI interface.
- **Consolidation cascade** — when triggered, Compozy spawns an ephemeral
  session that synthesizes recent activity into durable facts. This is an
  automated memory maintenance process.

This approach is pragmatic and human-readable (Markdown files can be inspected
and edited manually) but may have scalability limitations compared to
database-backed memory systems.

---

## Daemon Architecture

The Compozy runtime runs as a local daemon:

```
compozy daemon start    # Start the runtime
compozy status          # Check daemon health
compozy daemon stop     # Stop the runtime
```

The daemon provides:
- Background agent execution.
- Cron scheduling for automated workflows.
- Webhook endpoints for external triggers.
- HTTP/SSE and Unix Domain Socket (UDS) interfaces.

---

## Automation

CompozyOS supports continuous agent work without a terminal:
- **Cron schedules** — time-based agent execution.
- **Webhooks** — external event triggers.
- **Triggers** — configurable conditions that start agent work.
- **Loops** — iterative execution cycles.

---

## MCP Integration

The runtime provides MCP connectivity:
- Agents can access MCP servers through the control plane.
- NEEDS VERIFICATION: Can Compozy itself be exposed as an MCP server?

---

## Access Points

The runtime state is reachable from multiple interfaces:
- **Web UI** — browser-based dashboard for steering agents.
- **CLI** — command-line interface for developers.
- **HTTP/SSE** — programmatic access via REST and server-sent events.
- **UDS** — Unix Domain Socket for local inter-process communication.
- **MCP** — Model Context Protocol for agent tool access.
- **Native tools** — built-in tools for common operations.

---

## Key Observations

1. **Orchestration-only design** — Compozy does not implement agents, it
   coordinates them. This is a fundamentally different architectural approach
   from LangGraph, Agno, or Strands.
2. **Existing CLI agents** — by wrapping Claude Code, Codex, Gemini CLI, etc.,
   Compozy leverages mature, well-tested agent implementations rather than
   building its own.
3. **Local-first** — Go binary + SQLite, all state on the operator's machine.
4. **Markdown memory** — simple, human-readable, but potentially limiting at
   scale.
5. **Beta status** — v0.3 beta means APIs, abstractions, and behavior may
   change significantly.
6. **Developer-centric** — the design targets individual developers or small
   teams managing multiple coding agents, not enterprise multi-tenant
   deployments.

---

## Key Questions to Investigate

- [ ] What is the exact license?
- [ ] How does Compozy handle agent failures — retry, fallback to different
      agent, or manual intervention?
- [ ] What is the scaling story — can multiple Compozy instances coordinate, or
      is it single-machine only?
- [ ] How does the consolidation cascade prevent memory loss or corruption?
- [ ] What is the permission/RBAC model — can different users have different
      access to agents and tools?
- [ ] How does work splitting work — is it rule-based, LLM-decided, or manual?
- [ ] What is the company/team behind Compozy — funding, sustainability?
- [ ] How does the performance compare when orchestrating multiple concurrent
      agent sessions?

---

## Relevance to Allotey AI Platform

Compozy is interesting for its control-plane-only architecture — the idea that
an orchestration layer should not reimplement agents but coordinate existing
ones. The Markdown-based memory with consolidation cascades is a novel approach
worth studying. However, the local-first, developer-centric design does not
align with a multi-tenant enterprise platform. The beta status makes it
unsuitable as a dependency.

---

*Last updated: 2026-08-13*
*STATUS: NOT STARTED — architectural study only, pre-1.0 project*

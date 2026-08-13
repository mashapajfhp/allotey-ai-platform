# Agno — Deep Research Note

**Repository:** [agno-agi/agno](https://github.com/agno-agi/agno)
**Related:** [agno-agi/agentos-railway-template](https://github.com/agno-agi/agentos-railway-template)
**License:** MPL-2.0 (framework), proprietary (AgentOS control plane UI)
**Language:** Python
**Latest Release:** v2.6.4 (April 28, 2026)
**Status:** DEEP RESEARCH — substantive findings documented

---

## Overview

Agno (formerly Phidata) is an open-source Python framework and runtime for
building agentic software. It provides a three-layer architecture: a Python SDK
for building agents, teams, and workflows; AgentOS, a stateless FastAPI runtime
with production features; and a control-plane UI for monitoring deployments.

The framework ships with 80+ toolkits containing thousands of tools and supports
23+ LLM providers including OpenAI, Anthropic, Google Gemini, Mistral, and
more.

---

## Three-Layer Architecture

### 1. Framework (SDK)

The Python SDK for defining agents, teams, and workflows. An Agno agent is an
LLM wrapped with optional tools, a knowledge base, persistent memory, a
reasoning loop, and guardrails — all configured in a single Python class.

### 2. AgentOS Runtime

A stateless FastAPI application that serves agents over REST APIs. Key
properties:
- **Stateless and horizontally scalable** — no sticky sessions required.
- **Per-user, per-session isolation** — built-in multi-tenancy.
- **Approval workflows** — human-in-the-loop execution with runtime enforcement.
- **Native tracing** — full auditability via OpenTelemetry.
- **Integration endpoints** — ready-to-use connectors for Slack, Telegram,
  Discord, WhatsApp, and more.

### 3. AgentOS Control Plane

A web UI (at os.agno.com or self-hosted) for testing, monitoring, and managing
AgentOS deployments. From the control plane you can:
- Chat with agents interactively.
- Build new agents.
- Inspect sessions, traces, memory, and evaluation results.
- Manage deployments across environments.

---

## Agents

An agent is the fundamental unit. Configuration includes:
- **Model** — which LLM provider and model to use.
- **Tools** — functions the agent can call.
- **Knowledge** — vector-backed retrieval sources.
- **Memory** — short-term (session) and long-term (durable) storage.
- **Instructions** — system prompts and behavioral guidelines.
- **Guardrails** — PII detection, prompt injection defense, custom validators.

---

## Teams

Teams compose multiple agents that can plan, communicate, and delegate tasks.
Use cases include research pipelines, automated data processing, and
customer-support triage. Team coordination modes include:
- Supervisor-directed delegation.
- Collaborative discussion and consensus.
- Handoff-based sequential processing.

NEEDS VERIFICATION: What specific team coordination protocols are implemented?
Is there a formal handoff protocol, or is it prompt-engineered?

---

## Workflows

The workflow system orchestrates agents, teams, and functions with:
- **Approval workflows** — human-in-the-loop checkpoints.
- **Audit logs** — full execution history.
- **Scheduled execution** — agents that run on cron or event triggers.
- **Async tasks** — long-running operations that report back on completion.

NEEDS VERIFICATION: Is the workflow engine graph-based (like LangGraph) or
sequential/imperative?

---

## Memory

### Short-Term Memory
Tracks conversations and internal state within a session. Scoped to a single
interaction lifecycle.

### Long-Term Memory
Durable state storage for agents that evolve over time, run async tasks, or
operate in scheduled workflows. Persisted across sessions.

### Storage Backends
Sessions, memory, knowledge, and traces are stored in PostgreSQL + pgvector.
This provides both relational storage and vector similarity search in a single
database.

---

## Knowledge

Agno supports pluggable vector stores (PgVector as the primary option) and
provides hybrid search across structured documents, databases, and embeddings.
Knowledge is loaded from files, URLs, databases, or custom loaders and chunked,
embedded, and indexed automatically.

---

## Tools and MCP

### Built-in Toolkits
80+ toolkits covering web search, file operations, database queries, API calls,
email, calendar, and more.

### MCP Integration
First-class support for the Model Context Protocol. Agents can connect to
external MCP servers to access tools, and agents can be exposed as MCP servers.

### A2A Protocol
First-class support for Agent-to-Agent communication, enabling cross-framework
interoperability.

---

## Tracing and Observability

Agno ships with OpenTelemetry-based tracing. Every agent execution, tool call,
and LLM interaction is traced. Traces are viewable in the AgentOS control plane
or exported to any OTel-compatible backend.

---

## RBAC and Multi-Tenancy

### JWT-Based RBAC
AgentOS uses JWT tokens for authentication and role-based access control. Roles
determine which agents, tools, and data a user can access.

### Multi-Tenant Isolation
An opt-in per-user data isolation layer for authenticated endpoints. One
deployment can serve many users with separated data, without standing up
separate instances.

---

## Human Approval

Approval workflows allow sensitive tool executions to be paused and routed to a
human for review. The runtime enforces approval gates — an agent cannot bypass
them even if the LLM attempts to.

---

## Deployment

AgentOS provides multiple deployment options:
- **Railway** — starter template at `agno-agi/agentos-railway-template`.
- **Docker** — containerized deployment.
- **AWS, GCP, Azure** — cloud-native templates.
- **Fly, Render, Modal** — platform-as-a-service options.
- **Helm** — Kubernetes deployment.

The architecture places AgentOS in the customer's cloud. The control plane
connects to it from the browser, meaning data does not leave the customer's
infrastructure.

---

## agent-platform-railway: Coding Agents as Developers

The [agentos-railway-template](https://github.com/agno-agi/agentos-railway-template)
is notable for a meta-level capability: **coding agents can inspect and improve
the agent platform itself**.

Skills defined in `.agents/skills/` enable coding agents (e.g., Claude Code) to:
- **Add features** — new tools, refined prompts, bug fixes.
- **Run evaluations** — execute the eval suite, diagnose failures, fix issues.
- **Audit consistency** — sweep the repo for drift between docs, code, and
  config, auto-fixing mechanical issues like stale paths and missing env vars.

This represents a self-improving development workflow where the platform's own
agents contribute to its evolution.

---

## Evaluation

Recent releases (v2.5.13, March 2026) added **ReliabilityEval** for evaluating
agent behavior. NEEDS VERIFICATION: What evaluation primitives are available
beyond ReliabilityEval? Are there conversation-level, tool-call-level, and
end-to-end evaluation capabilities?

---

## Key Findings

1. **Production-ready runtime** — AgentOS provides a genuine production path
   with RBAC, multi-tenancy, tracing, and approval workflows.
2. **Self-hosted data sovereignty** — the architecture keeps data in the
   customer's cloud with only the control plane connecting externally.
3. **PostgreSQL-centric** — everything (sessions, memory, knowledge, traces)
   runs on Postgres + pgvector, reducing operational complexity.
4. **Self-improving development** — the coding-agents-as-developers pattern is
   unique among the frameworks studied.
5. **Single-language** — Python only. No TypeScript/JavaScript SDK.

---

## Open Questions

- [ ] What is the actual licensing split between MPL-2.0 (framework) and the
      control plane? Can the control plane be fully self-hosted?
- [ ] How does team coordination scale with many agents? What are the
      performance characteristics?
- [ ] What is the guardrail architecture — built-in only, or pluggable?
- [ ] How does the workflow engine compare to LangGraph's StateGraph for
      complex branching and parallel execution?
- [ ] What is the cost/pricing model for the hosted control plane at
      os.agno.com?

---

*Last updated: 2026-08-13*
*STATUS: DEEP RESEARCH — substantive findings from web research, repo analysis pending*

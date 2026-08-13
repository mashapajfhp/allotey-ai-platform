# OpenFang — Research Note

**Repository:** [RightNow-AI/openfang](https://github.com/RightNow-AI/openfang)
**License:** NEEDS VERIFICATION (likely MIT or Apache-2.0 based on "open-source"
claims)
**Language:** Rust
**Website:** [openfang.sh](https://www.openfang.sh/)
**Status:** NOT STARTED — early-stage project, maturity evaluation required

---

## Overview

OpenFang positions itself as an "Agent Operating System" — a runtime for
autonomous agents that work on schedules, build knowledge graphs, monitor
targets, generate leads, manage social media, and report results. The entire
runtime compiles to a single 32MB statically-linked binary with no runtime
dependencies (no node_modules, no Docker required).

The project targets a v1.0 release by mid-2026.

---

## Core Concepts

### Hands (Capability Packages)

"Hands" are OpenFang's core innovation — pre-built autonomous capability
packages that run independently, on schedules, without user prompting. Each
Hand is a self-contained unit of agent capability.

### HAND.toml (Manifests)

Each Hand declares its requirements, capabilities, and configuration in a
`HAND.toml` manifest file:
- **Tools** — what tools the Hand can use.
- **Settings** — configurable parameters.
- **Requirements** — dependencies and environment needs.
- **Dashboard metrics** — what data the Hand exposes to the monitoring
  dashboard.

### Scheduling

Agents run on configurable schedules (cron-like), enabling continuous
autonomous operation without human initiation. This is fundamentally different
from most agent frameworks that are request-response oriented.

---

## Runtime Isolation and Security

OpenFang emphasizes security with 16 layers of protection:

- **WASM dual-metered sandbox** — tool code runs inside WebAssembly with both
  CPU and memory metering.
- **Ed25519 manifest signing** — cryptographic verification of Hand manifests.
- **Merkle audit trail** — tamper-evident log of all agent actions.
- **Taint tracking** — data flow tracking to prevent information leakage.
- **SSRF protection** — prevents server-side request forgery attacks.
- **Secret zeroization** — secrets are securely wiped from memory after use.
- **Workspace-confined file operations** — file access is sandboxed to the
  Hand's workspace.
- **Environment-cleared subprocesses** — child processes do not inherit the
  parent's environment variables.
- **Timeout enforcement** — all operations have configurable timeouts.

The WASM-based isolation is architecturally notable — it provides stronger
sandboxing than process-level isolation without the overhead of container-based
approaches.

---

## Architecture

### Single Binary
The entire runtime is a single Rust binary. No Docker, no container
orchestration, no language runtimes. This dramatically simplifies deployment
and reduces attack surface.

### Dashboard
A built-in dashboard for monitoring agent activity, viewing metrics defined in
HAND.toml manifests, and managing scheduled runs.

---

## 2026 Development Roadmap

Based on community proposals and issues, the project is working toward:

- **Lifecycle engine** — managing agent creation, deployment, scaling, and
  retirement.
- **Auto-claim logic** — agents automatically picking up available work items.
- **Team abstraction** — first-class concept of agent teams.
- **Role-typed delegation** — agents with specific roles delegating to other
  agents based on capabilities.
- **Structured handoff protocol** — formalized protocol for agents passing
  work to each other.
- **Work queues** — job queue system for distributing work across agents.
- **Budget governance** — cost limits and tracking for agent operations.
- **Multi-tenant isolation** — serving multiple users/orgs from a single
  deployment.

NEEDS VERIFICATION: Which of these roadmap items have shipped and which are
proposals?

---

## Maturity Assessment

### Strengths
- **Rust performance** — low overhead, minimal resource consumption.
- **Strong security model** — WASM sandboxing, cryptographic signing, audit
  trails.
- **Single binary deployment** — operationally simple.
- **Schedule-first design** — unique among agent frameworks.

### Concerns
- **Pre-1.0** — the project has not reached a stable release.
- **Small community** — limited GitHub activity relative to major frameworks.
- **Narrow focus** — optimized for scheduled autonomous tasks, not
  conversational agents or complex multi-step reasoning.
- **Limited LLM integration details** — NEEDS VERIFICATION on which LLM
  providers are supported and how model calls are handled.
- **Ecosystem size** — how many Hands are available? Is there a marketplace?

### Warning

**Do not make OpenFang a critical dependency without thorough maturity
evaluation.** The project shows interesting architectural ideas (WASM
isolation, manifest-driven packaging, schedule-first agents) but has not
demonstrated production readiness at scale. The pre-1.0 status means APIs,
manifest formats, and core abstractions may change.

---

## Key Questions to Investigate

- [ ] What is the exact license?
- [ ] How many Hands exist in the ecosystem?
- [ ] What LLM providers are supported?
- [ ] What is the actual production usage — who is running OpenFang in
      production?
- [ ] How does the WASM sandbox handle tool calls that need network access or
      filesystem access beyond the workspace?
- [ ] Is there an MCP integration?
- [ ] What is the team/company behind RightNow-AI — funding, headcount,
      sustainability?
- [ ] How does the scheduling model interact with event-driven triggers?

---

## Relevance to Allotey AI Platform

OpenFang is interesting as an architectural study for its schedule-first agent
model, WASM-based isolation, and manifest-driven packaging. These concepts
could inform the design of an agent operations layer. However, the pre-1.0
status and narrow community make it unsuitable as a foundational dependency.
Monitor for maturity progress.

---

*Last updated: 2026-08-13*
*STATUS: NOT STARTED — monitor for maturity, do not adopt as dependency*

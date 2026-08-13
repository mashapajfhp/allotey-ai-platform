# AGNT — Research Note

**Repository:** [agnt-gg/agnt](https://github.com/agnt-gg/agnt)
**License:** NEEDS VERIFICATION
**Language:** NEEDS VERIFICATION (likely TypeScript/Node.js based on the
platform's web-native approach)
**Website:** [agnt.gg](https://www.agnt.gg/)
**Status:** NOT STARTED — initial observations from web research

---

## Overview

AGNT positions itself as a "local-first operating system for building, running,
and improving AI agents, workflows, and autonomous goals." It overlaps with
agent frameworks, workflow tools, plugin ecosystems, and self-improving skill
systems, with its distinctive strength being the union of these capabilities
in a single local-first platform.

---

## Goals

AGNT introduces a **goals** concept for long-running autonomous objectives.
Unlike single-turn agent interactions or fixed workflows, goals represent
persistent objectives that agents work toward over time. This enables:

- Multi-session work toward an objective.
- Progress tracking and checkpointing.
- Adaptive re-planning as conditions change.

NEEDS VERIFICATION: How are goals defined — structured schema, natural
language, or hybrid? What is the progress tracking mechanism?

---

## Tasks

Tasks are discrete units of work within a goal or workflow. Each task can:
- Be assigned to an agent.
- Have defined inputs and outputs.
- Report completion status and results.

NEEDS VERIFICATION: How do tasks relate to goals at runtime — is there
automatic task decomposition from goals?

---

## Workflows

Visual workflow authoring with:
- **Triggers** — events that start a workflow (webhooks, timers, messages, cron
  schedules).
- **Branches** — conditional execution paths.
- **Nested workflows** — composable workflow units.
- **Timers** — time-based delays and scheduling.
- **Messaging triggers** — workflows triggered by external messages.

---

## Agents

Agents in AGNT operate within the broader system:
- Can run single-agent or multi-agent workloads.
- Access tools, plugins, and knowledge during execution.
- Produce execution records with full traces.

---

## Memory

AGNT provides multiple memory primitives:
- **Facts** — verified information the agent has learned.
- **Preferences** — user or system preferences that inform agent behavior.
- **Corrections** — records of mistakes and their fixes.
- **Insights** — derived understanding from past interactions.

Memory is local-first, stored in a local database with persistence across
sessions.

---

## Skills and Self-Improvement

### Skills
Skills are reusable instruction sets (typically `SKILL.md` files) that teach an
agent how to perform specific tasks. As of April 2026:
- 5,200+ community-contributed skills.
- Hundreds of official and verified skills.
- A growing marketplace for skill discovery and sharing.

### SkillForge
A mechanism for agents to create, refine, and improve their own skills based
on experience:
- **Datasets** — collections of examples for skill training.
- **Experiments** — A/B testing of skill variations.
- **Evolution** — skills improve over multiple iterations.

This self-improvement capability is architecturally distinctive — most agent
frameworks treat skills/tools as static definitions.

---

## Traces and Execution Records

Every workstream produces durable execution records:
- Tool-call traces with inputs and outputs.
- Token and cost accounting.
- Retry history.
- Pause/resume/revert capability.
- Human approval gate records.
- Memory extraction events (what the agent learned).
- Skill evolution history.

---

## Durable Execution

AGNT provides durability features:
- **Pause/resume** — stop and restart agent work.
- **Revert** — roll back to a previous state.
- **Human approval gates** — pause for human review.
- **Retries** — automatic retry on failure.
- **Local database state** — all execution state persisted locally.

---

## Plugins

Plugin system for extending agent capabilities. NEEDS VERIFICATION: What is the
plugin architecture — is it similar to MCP tools, or a custom plugin format?

---

## Dashboard and API

- **Dashboard** — web-based monitoring of agent activity, goal progress, and
  system health.
- **API access** — programmatic control of agents, workflows, and goals.

---

## Local-First Architecture

AGNT emphasizes local-first operation:
- Data stays on the operator's machine.
- No mandatory cloud dependencies.
- Local database for persistence.
- Execution happens locally, not in a remote runtime.

This is a deliberate design choice for privacy and control, but it raises
questions about scaling and team collaboration.

---

## Key Observations

1. **Self-improving skills** — the SkillForge concept (agents creating and
   refining their own skills) is unique in this research set.
2. **Goals as first-class objects** — persistent, multi-session objectives go
   beyond what most frameworks offer.
3. **Large skill ecosystem** — 5,200+ community skills suggests meaningful
   adoption.
4. **Local-first trade-offs** — strong for privacy and individual use, but
   unclear how it handles multi-user, multi-machine, or cloud deployments.
5. **Memory model** — the facts/preferences/corrections/insights taxonomy is
   more nuanced than simple session/long-term memory.

---

## Key Questions to Investigate

- [ ] What is the exact license?
- [ ] What LLM providers are supported?
- [ ] Is there MCP support?
- [ ] How does the local-first model handle team collaboration and shared
      agents?
- [ ] What is the deployment model for production — can it run as a server, or
      is it desktop-only?
- [ ] How does SkillForge prevent skill degradation over time?
- [ ] What is the governance model for the skill marketplace — quality control,
      security review?
- [ ] How does AGNT compare to Agno's AgentOS for production deployments?
- [ ] What is the company/team behind AGNT — funding, sustainability?

---

## Relevance to Allotey AI Platform

AGNT is most interesting for its self-improving skills concept and persistent
goals abstraction. These are architectural patterns worth studying even if the
platform itself is not adopted. The local-first design may not align with a
cloud-native platform architecture, but the memory taxonomy and skill evolution
mechanisms could be adapted.

---

*Last updated: 2026-08-13*
*STATUS: NOT STARTED — requires deeper investigation of architecture and production readiness*

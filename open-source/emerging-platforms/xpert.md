# Xpert AI — Deep Research Note

**Repository:** [xpert-ai/xpert](https://github.com/xpert-ai/xpert)
**License:** AGPL-3.0 (Community Edition); commercial licenses available
**Language:** TypeScript
**Website:** [xpertai.cn](https://xpertai.cn/)
**Status:** DEEP RESEARCH — architecture study, licensing review required

---

## Overview

Xpert AI is an open-source enterprise Agent platform for multi-agent
orchestration, governed data execution, Agentic BI, plugins, and focused
Agentic Apps. The platform is designed specifically for business decision-making
use cases, combining agent-based reasoning with structured enterprise data
through semantic business objects.

---

## AGPL-3.0 License — Critical Consideration

The Community Edition uses **GNU Affero General Public License v3.0**. This
means:

- Any modifications to the codebase must be released under AGPL-3.0.
- If the software is made available over a network (e.g., as a SaaS), the
  complete source code must be made available to users.
- Linking or embedding AGPL code into a proprietary application may trigger
  copyleft requirements for the entire combined work.

**Impact on Allotey AI Platform:**
- Cannot embed Xpert components into a proprietary platform without releasing
  the platform's source code.
- Could potentially use Xpert as a standalone service accessed via API, but
  legal review is needed to confirm this isolation is sufficient under AGPL.
- Commercial license alternatives exist — pricing NEEDS VERIFICATION.

**Recommendation:** Treat as architecture study only. Do not integrate until
legal review of AGPL implications is complete.

---

## Multi-Agent Orchestration

Xpert supports multiple agent topologies:

### Single Agent
A standalone agent with tools, knowledge, and a reasoning loop.

### Supervisor
A coordinator agent that delegates tasks to specialized worker agents.

### Hierarchical
Multi-level delegation where supervisor agents manage sub-supervisors.

### Swarm
Agents self-organize and collaborate without a central coordinator.

### Hybrid (Agent/Workflow)
Flexible reasoning through agents combined with stable, inspectable control
paths through workflows. This hybrid approach is a distinctive architectural
choice — using agents for ambiguous tasks and workflows for deterministic
sequences.

---

## Agentic BI — Core Differentiator

This is Xpert's most distinctive capability. The Agentic BI module
(also called "Data Xpert" or "ChatBI") turns structured business data into a
governed semantic environment for agent reasoning and execution.

### Semantic Business Objects

The platform defines a semantic layer over raw data:

- **Dimensions** — categorical attributes (region, product, department).
- **Measures** — quantitative metrics (revenue, count, average).
- **Formulas** — derived calculations over measures.
- **Indicators** — reusable business KPIs composed from dimensions, measures,
  and formulas.
- **Entities** — business objects with typed attributes and relationships.
- **Relationships** — links between entities (joins, hierarchies).
- **Policies** — access control and data governance rules.

### Governed Execution

Agents reason over these semantic objects rather than writing raw SQL against
databases. This provides:

- **Type safety** — agents work with typed business concepts, not arbitrary
  strings.
- **Access control** — policies determine which data an agent (and its user)
  can access.
- **Auditability** — every data query is traced through the semantic layer.
- **Consistency** — business metric definitions are centralized, not scattered
  across ad-hoc queries.

---

## Workflows

The workflow engine provides visual authoring of multi-step processes:

- **Workflow nodes** — individual processing steps.
- **Conditional branching** — route execution based on data or agent decisions.
- **Agent nodes** — invoke an agent as a step in a workflow.
- **Tool nodes** — call external tools or APIs.
- **Human approval nodes** — pause for human review.

Workflows are the "stable, inspectable control path" counterpart to the
flexible reasoning of agents.

---

## RAG and Knowledge

- **File-based knowledge** — upload documents for retrieval-augmented
  generation.
- **Skill-based knowledge** — structured procedures and instructions.
- **Database connections** — direct access to enterprise databases through the
  semantic layer.
- **MCP tool access** — connect to external systems via Model Context Protocol.

---

## Plugins

Xpert uses a plugin architecture for extending the platform:

- **Assistant tools** — tools available to agents during reasoning.
- **Review views** — custom UI components for reviewing agent output.
- **Remote components** — externally hosted UI and logic.
- **Configuration hooks** — plugin-level settings.
- **Lifecycle hooks** — callbacks at various points in the agent execution
  lifecycle.

The `xpert-plugins` repository is also AGPL-3.0 licensed.

---

## Enterprise Features

### Auditability
Every agent decision, tool call, and data access is logged with full
provenance. Audit trails connect agent actions to business outcomes.

### Governance
- Typed tools expose data and business actions through a governed interface.
- Policies control what agents can access and do.
- Approval gates prevent unauthorized actions.

### Integration Points
- Databases (PostgreSQL, MySQL, ClickHouse, and others via semantic layer).
- APIs and business systems via tools and MCP.
- Knowledge bases for unstructured data.
- Workflow triggers from external events.

---

## Architecture Study Points

### What to Learn from Xpert

1. **Semantic layer for agent data access** — the idea of agents reasoning over
   typed business objects rather than raw data is architecturally sound and
   worth studying for any enterprise agent platform.

2. **Hybrid agent/workflow design** — using agents for flexible reasoning and
   workflows for deterministic control is a pragmatic pattern.

3. **Governed tool execution** — exposing business actions through typed,
   policy-controlled tools rather than giving agents raw access.

4. **Indicator/KPI management** — centralizing business metric definitions in a
   semantic layer that agents can query.

### What to Be Cautious About

1. **AGPL license** — cannot incorporate without releasing our own source code.
2. **Chinese-market focus** — documentation and community are primarily in
   Chinese, which may limit support options.
3. **Maturity** — NEEDS VERIFICATION on production deployments, community size,
   and release cadence.
4. **Commercial license terms** — pricing and restrictions unknown.

---

## Technical Stack

- **Frontend:** Angular (NEEDS VERIFICATION)
- **Backend:** NestJS (TypeScript)
- **Database:** PostgreSQL (primary), support for other databases through
  semantic layer
- **AI:** Multi-model support (OpenAI, Anthropic, local models)
- **Semantic Layer:** Custom implementation over OLAP/analytical databases

NEEDS VERIFICATION: Full technical stack details from the repository.

---

## Key Findings

1. **Strongest Agentic BI story** in this research set — the semantic layer
   approach is more sophisticated than other platforms' database tool access.
2. **AGPL is a hard blocker** for embedding into a proprietary platform.
3. **Architecture patterns are valuable** even if the code itself cannot be
   used — the semantic business object model, governed execution, and hybrid
   agent/workflow design are worth implementing independently.
4. **Enterprise governance features** (audit trails, policies, approval gates)
   are well-designed for the target use case.

---

## Open Questions

- [ ] What is the commercial license pricing and what restrictions does it
      remove?
- [ ] Can Xpert's semantic layer be used independently of the agent platform?
- [ ] How does the semantic model authoring workflow work — is it code-based,
      visual, or both?
- [ ] What is the performance of Agentic BI queries at scale?
- [ ] How does Xpert compare to dbt's semantic layer + an agent framework as
      an alternative architecture?
- [ ] What are the actual production deployments — scale, industry, geography?

---

*Last updated: 2026-08-13*
*STATUS: DEEP RESEARCH — architecture study only until AGPL licensing review is complete*

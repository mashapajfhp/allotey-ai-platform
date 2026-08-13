# Dify — Research Note

**Repository:** [langgenius/dify](https://github.com/langgenius/dify)
**License:** Modified Apache-2.0 ("Dify Open Source License") — NOT plain Apache-2.0
**Language:** Python (backend), TypeScript (frontend)
**Website:** [dify.ai](https://dify.ai/)
**Funding:** $30M Series Pre-A (March 2026)
**Status:** NOT STARTED — licensing concerns noted, key architecture questions to investigate

---

## Overview

Dify is an open-source platform for building, deploying, and operating AI
applications. It combines visual workflow orchestration, RAG pipelines, agent
execution, model abstraction, and MCP support in a single self-hostable
package. The project has significant traction — it is one of the most-starred
AI platforms on GitHub.

---

## Licensing — Critical Concern

Dify uses what it calls the "Dify Open Source License," which is described as
Apache-2.0-based with additional conditions. Key restrictions:

- **SaaS restriction** — using Dify to offer a competing SaaS product may
  require a commercial license.
- **Multi-tenant hosting** — offering Dify as a hosted service to third parties
  may trigger commercial license requirements.
- **Branding requirements** — NEEDS VERIFICATION on whether "powered by Dify"
  attribution is required.

**This is NOT plain Apache-2.0.** The additional conditions make redistribution
and embedding more restrictive than standard Apache-2.0. Legal review is
required before any integration or deployment.

**Impact on Allotey AI Platform:**
- Self-hosting for internal use is likely fine.
- Building a commercial product on top of Dify requires careful license review.
- Offering Dify-powered capabilities to customers as a service likely requires
  a commercial license.

---

## Workflow Engine

Dify provides a visual workflow builder for composing multi-step AI
applications:

- **Node types** — LLM calls, code execution, conditional branches, variable
  assignment, HTTP requests, tool calls, knowledge retrieval, and more.
- **Visual authoring** — drag-and-drop workflow design in the browser.
- **Debugging** — step-through execution with intermediate state inspection.
- **Versioning** — workflow versions with rollback capability.

Workflows can be published as APIs, chatbots, or embedded components.

---

## Agents

Dify supports agent-based applications where an LLM reasons about tool
selection and execution:

- **Tool selection** — the agent chooses which tools to invoke based on the
  user's request.
- **Iteration** — the agent can loop, re-plan, and retry.
- **Agent + Workflow hybrid** — agents can invoke workflows as tools, and
  workflows can contain agent nodes.

---

## Knowledge / RAG

The knowledge system provides document-based retrieval-augmented generation:

- **Document ingestion** — upload files (PDF, DOCX, TXT, etc.) or connect
  data sources.
- **Pipeline plugins** — choose plugins for parsing, cleaning, chunking, and
  embedding. The plugin ecosystem allows third-party contributions.
- **Retrieval** — vector search, keyword search, or hybrid retrieval.
- **Knowledge pipeline** — a structured process from raw document to indexed,
  searchable knowledge.

---

## Model Abstraction

Dify abstracts across multiple LLM providers:
- OpenAI, Anthropic, Google, Azure OpenAI, AWS Bedrock, Mistral, and more.
- Local models via Ollama, Xinference, and others.
- The abstraction covers chat, completion, embedding, and reranking models.

---

## Plugins and MCP

### Plugin System
Dify v1.6.0 introduced a plugin marketplace and architecture:
- Plugins extend Dify's capabilities (tools, model providers, data sources).
- The marketplace allows community-contributed plugins.
- A recent tool (`dify-mcp`) exposes the entire Dify console API as 138 MCP
  tools, allowing AI agents to programmatically create apps, author workflows,
  test, and publish.

### MCP Support (Bidirectional)
- **As MCP client** — agents inside Dify can connect to external MCP servers
  (filesystems, GitHub, Slack, databases, browsers).
- **As MCP server** — Dify tools and workflows can be exposed to external
  MCP-compatible clients.

---

## Application Publishing

Built applications can be deployed as:
- **Chat interface** — conversational UI.
- **Text generation** — API endpoint for text completion.
- **Workflow API** — RESTful API for workflow execution.
- **Embedded widget** — JavaScript snippet for embedding in web pages.

---

## Observability

- Request logging with full conversation history.
- Token usage and cost tracking.
- Workflow execution traces with per-node timing.
- Annotation and feedback collection.

NEEDS VERIFICATION: Does Dify support OpenTelemetry export, or is observability
limited to the built-in dashboard?

---

## Key Architecture Questions to Investigate

- [ ] What are the exact restrictions in the "Dify Open Source License" beyond
      standard Apache-2.0?
- [ ] How does Dify's workflow engine compare to LangGraph's StateGraph for
      complex, branching agent workflows?
- [ ] What is the plugin security model — are plugins sandboxed?
- [ ] How does Dify handle multi-tenancy — is there built-in user/team/org
      isolation?
- [ ] What is the production deployment architecture — database requirements,
      scaling model, HA?
- [ ] Can Dify's workflow engine be used programmatically (API-first) without
      the visual builder?
- [ ] How does the RAG pipeline compare to dedicated RAG frameworks like
      LlamaIndex?
- [ ] What is the upgrade path between self-hosted and Dify Cloud?

---

## Relevance to Allotey AI Platform

Dify is the most feature-complete "all-in-one" platform in this research set —
it bundles workflows, agents, RAG, model abstraction, MCP, and a visual builder
into a single deployable package. However, the non-standard license is a
significant concern for commercial use. The visual workflow builder is
compelling for non-developer users but may be too opinionated for a platform
that needs to be highly customizable.

---

*Last updated: 2026-08-13*
*STATUS: NOT STARTED — licensing concerns require legal review before deeper investigation*

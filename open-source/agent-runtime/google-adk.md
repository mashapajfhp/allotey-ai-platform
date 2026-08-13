# Google Agent Development Kit (ADK) — Research Note

**Repositories:** [google/adk-python](https://github.com/google/adk-python),
[google/adk-js](https://github.com/google/adk-js)
**License:** Apache-2.0
**Language:** Python, JavaScript/TypeScript
**Status:** NOT STARTED — key architecture questions to investigate

---

## Overview

Google's Agent Development Kit (ADK) is a code-first, open-source framework for
building, evaluating, and deploying multi-agent applications. Originally
launched alongside Google Cloud's Vertex AI Agent Builder, the SDK itself is
Apache-2.0 licensed and can run outside Google Cloud. As of mid-2026, ADK has
reached version 2.5 with graph-native workflows, resumable human-in-the-loop
execution, and state-based recovery.

---

## Agent Model

ADK defines three agent categories:

### LLM-Based Agents
Standard agents that use a large language model for reasoning, tool selection,
and response generation. These are the primary building block.

### Workflow Agents
Agents that do not use an LLM and provide orchestration only. They coordinate
other agents through fixed control flow:
- **Sequential agents** — execute child agents in order.
- **Parallel agents** — execute child agents concurrently.
- **Loop agents** — repeat a child agent until a condition is met.
- **Routing agents** — dispatch to a child agent based on input conditions.

### Custom Agents
User-defined agent types that extend the base agent class with arbitrary logic.

---

## Tools

ADK supports function-based tools (Python functions decorated for LLM
consumption), built-in tools (code execution, Google Search, Vertex AI
extensions), and external tools via MCP.

### Tool Confirmation Flow (HITL)
ADK provides a tool confirmation mechanism where the agent can pause before
executing a tool and wait for human approval. This shipped as part of the
v2.5 release.

---

## Agent Config (No-Code)
ADK also supports an "agent config" mode where you can build an ADK workflow
without writing code, using YAML or JSON configuration files. NEEDS
VERIFICATION on how far this extends — whether it covers full workflow
orchestration or only simple single-agent setups.

---

## Multi-Agent Coordination

Multiple agents can be composed in a parent-child hierarchy. The parent agent
(or a workflow agent) coordinates execution, passing context and results between
child agents. Each agent can use different models.

---

## MCP Integration

ADK provides bidirectional MCP support:

- **As MCP client:** `McpToolset` bridges the MCP protocol into ADK, allowing
  any agent to use tools exposed by external MCP servers.
- **As MCP server:** An ADK agent can be exposed as an MCP server, making its
  tools available to other MCP-compatible clients.

---

## A2A Protocol

ADK supports the Agent-to-Agent (A2A) protocol — Google's open standard for
cross-framework agent communication. This allows ADK agents to communicate with
agents built in other frameworks (e.g., LangGraph, Strands) through a
standardized RPC-like interface.

---

## Evaluation

ADK includes built-in evaluation capabilities for testing agent behavior. NEEDS
VERIFICATION on what evaluation primitives are provided out of the box versus
what requires Vertex AI integration.

---

## Key Architecture Questions to Investigate

- [ ] How does ADK handle state persistence across sessions? Is there a built-in
      checkpointing mechanism comparable to LangGraph's?
- [ ] What is the deployment story outside Google Cloud? Are there production
      deployment patterns for self-hosted environments?
- [ ] How does the A2A protocol compare to MCP in practice? Is it complementary
      or competing?
- [ ] What is the actual adoption of adk-js? Is it production-ready or
      experimental?
- [ ] How do workflow agents compose with LLM-based agents — can a workflow
      agent have an LLM-based agent as a child and vice versa?
- [ ] What observability hooks are available outside of Google Cloud Trace?
- [ ] How does ADK handle multi-tenancy and user isolation?
- [ ] What is the evaluation framework's scope — unit tests for tool calls,
      end-to-end conversation evaluation, or both?

---

## Relevance to Allotey AI Platform

ADK is notable for its clean separation of workflow orchestration (no-LLM) from
LLM-based reasoning, and for first-class A2A and MCP support. The Apache-2.0
license is favorable. The question is how tightly coupled the production
deployment path is to Google Cloud and Vertex AI.

---

*Last updated: 2026-08-13*
*STATUS: NOT STARTED — notes from initial web research only*

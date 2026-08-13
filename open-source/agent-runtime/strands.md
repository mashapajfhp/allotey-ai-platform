# Strands Agents — Research Note

**Repositories:** [strands-agents/sdk-python](https://github.com/strands-agents/sdk-python),
[strands-agents/sdk-typescript](https://github.com/strands-agents/sdk-typescript)
**License:** Apache-2.0
**Language:** Python, TypeScript
**Status:** NOT STARTED — key architecture questions to investigate

---

## Overview

Strands Agents is an open-source SDK (originally from AWS) that takes a
model-driven approach to building AI agents. It scales from simple
conversational assistants to complex autonomous workflows. The SDK emphasizes
model-agnosticism, first-class MCP support, and multiple multi-agent
coordination patterns.

---

## Model Abstraction

Strands is model-agnostic — supporting Amazon Bedrock, Anthropic, OpenAI,
Google Gemini, Ollama, LiteLLM, llama.cpp, and more. Swapping providers
requires changing a single line of configuration. The abstraction layer
normalizes tool calling, streaming, and message formats across providers.

---

## Tools

Tools are defined using Python decorators that automatically convert functions
into LLM-consumable tool definitions. The decorator extracts:
- Function name and docstring for the tool description.
- Type hints and parameter names for the input schema.
- Return type for output handling.

This approach minimizes boilerplate compared to manual tool schema definitions.

---

## MCP Integration

MCP is treated as a first-class citizen. Strands agents can connect to any
MCP server to access external tools (filesystems, databases, APIs, browsers).

A recent feature proposal (February 2026) introduces **MCPAgent** — a
client-side agent class that implements `AgentBase`, following the same pattern
as `A2AAgent`. This makes MCP servers work like any other Strands agent in
multi-agent compositions.

NEEDS VERIFICATION: Has MCPAgent shipped in a release, or is it still a
proposal?

---

## Multi-Agent Patterns

Strands provides several coordination patterns:

### Subagents
Nested agent instances where a parent agent delegates subtasks. Each subagent
can use a different model.

### Agent as Tool
A pattern where one agent is wrapped as a tool callable by another agent. This
enables model switching within a single conversation flow.

### Multi-Agent Graph
Deterministic DAG-based multi-agent pipelines. Agents are nodes in a directed
acyclic graph with explicit data flow between them. This is for workflows that
need predictable execution order rather than dynamic routing.

### Swarm Intelligence
Coordination of multiple AI agents that can self-organize, delegate, and
collaborate on tasks. NEEDS VERIFICATION on the specific swarm coordination
protocol — is this a structured pattern or emergent behavior?

---

## Workflows

NEEDS VERIFICATION: The relationship between "Multi-Agent Graph" and a broader
workflow engine is unclear. Is there a workflow abstraction beyond DAG-based
agent composition?

---

## Observability

NEEDS VERIFICATION: What observability hooks does Strands provide? Are there
built-in tracing, logging, or metrics capabilities, or does it rely on external
integrations?

---

## Evaluation

NEEDS VERIFICATION: Does Strands provide any built-in evaluation or testing
framework for agent behavior?

---

## Key Architecture Questions to Investigate

- [ ] What is the state persistence story? Does Strands have checkpointing,
      threads, or durable execution comparable to LangGraph?
- [ ] How does the MCPAgent proposal compare to ADK's McpToolset approach?
- [ ] What is the actual production deployment model — is there a runtime/server
      component, or is it purely a library?
- [ ] How does the TypeScript SDK compare in feature coverage to Python?
- [ ] What is the relationship to AWS — is there tight coupling to Bedrock, or
      is the AWS origin purely historical?
- [ ] How mature is the swarm pattern for production use?
- [ ] What human-in-the-loop capabilities exist?
- [ ] How does Strands handle multi-tenancy and user isolation?

---

## Relevance to Allotey AI Platform

Strands is interesting for its clean model abstraction, decorator-based tool
definition, and first-class MCP treatment. The Apache-2.0 license is favorable.
The AWS origin and Bedrock integration could be a strength if we deploy on AWS.
The multi-agent graph pattern is worth comparing against LangGraph's StateGraph
and Microsoft Agent Framework's workflows.

---

*Last updated: 2026-08-13*
*STATUS: NOT STARTED — notes from initial web research only*

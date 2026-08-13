# LangGraph — Research Note

**Repository:** [langchain-ai/langgraph](https://github.com/langchain-ai/langgraph)
**License:** MIT
**Language:** Python, TypeScript
**Status:** NOT STARTED — key architecture questions to investigate

---

## Overview

LangGraph is a framework from LangChain for building stateful, multi-step agent
applications as directed graphs. The central abstraction is the **StateGraph** —
a data structure that defines what the agent remembers (state), what it can do
(nodes), and how it decides what to do next (edges). As of mid-2026 the
TypeScript version has feature-parity with Python and sees over 42,000 weekly
npm downloads.

---

## Core Architecture

### StateGraph

The StateGraph is compiled into a runnable graph. It holds:
- A **state schema** (typically a TypedDict or Pydantic model) that every node
  reads and writes.
- **Nodes** — Python/TS functions that receive the current state, perform an
  action (call an LLM, run a tool, validate output), and return a partial
  state update.
- **Edges** — routing rules that determine the next node to execute.

### Nodes

Each node is a discrete processing unit. It receives the full current state
object, performs its work, and returns only the fields it wants to update. The
graph merges that partial update into the running state before routing to the
next node.

### Edges

- **Direct edges:** fixed sequences (node A always goes to node B).
- **Conditional edges:** branching logic that inspects state and returns the
  name of the next node. This is the primary mechanism for agent decision-making.

### Reducers

Reducers control how partial state updates from nodes are merged into the
existing state. The default reducer overwrites, but custom reducers can append
to lists, merge dictionaries, or apply arbitrary logic. This is how message
histories accumulate without each node needing to carry the full history.

---

## Durability and Persistence

### Checkpointing

A checkpoint is persisted after every node execution by a **checkpointer**
backend:
- `MemorySaver` — in-memory, development only.
- `PostgresSaver` — production-grade, durable.

When an agent fails, execution can resume from the most recent checkpoint.
Checkpointing is not just a log — it is a full recovery point for interruption,
timeout, human handoff, and service restart.

### Threads

A **thread** is an isolated execution context identified by a `thread_id`. Each
thread has its own checkpoint history. Multiple threads can run the same graph
concurrently with different state. This maps naturally to per-user or
per-conversation isolation.

---

## Human-in-the-Loop and Interrupts

LangGraph provides two primitives:

- **`interrupt(payload)`** — suspends the graph at a specific node and captures
  an optional payload to surface to the user (e.g., a question, a proposed tool
  call).
- **`Command(resume=value)`** — resumes the graph from where it stopped,
  injecting the human's response back into state.

Both require a checkpointer to persist state across the execution boundary.

---

## Subgraphs

Subgraphs split a large graph into composable, independently testable modules.
When a node is itself another compiled StateGraph:
- Its internal state is separate from the parent.
- Interrupts within the subgraph bubble up to the parent.
- The parent can pass data in and receive results out through shared state keys.

---

## Tool Execution

LangGraph does not prescribe a specific tool format but integrates tightly with
LangChain's tool abstraction. Nodes can call tools, receive results, and route
based on tool output. The graph structure makes it straightforward to add
retry loops, validation steps, or human approval before tool execution.

---

## Streaming

LangGraph decouples streaming into distinct modes, allowing developers to choose
what the frontend receives:
- Token-level streaming from LLM calls.
- Node-level events (which node started, which node completed).
- State updates as they happen.

This is described as exposing the agent's "cognitive metabolism" in real-time.

---

## Key Architecture Questions to Investigate

- [ ] How does the reducer system handle conflicts when two branches of a
      parallel execution update the same state key?
- [ ] What is the actual overhead of PostgresSaver checkpointing at every node
      in high-throughput scenarios?
- [ ] How do subgraph state boundaries interact with the parent graph's
      reducers?
- [ ] What is the story for multi-tenant isolation — is thread_id sufficient, or
      is there a higher-level partitioning mechanism?
- [ ] How does LangGraph compare to Microsoft Agent Framework's graph-based
      workflows in terms of execution semantics (superstep convergence vs.
      node-by-node)?
- [ ] What is the deployment model — is LangGraph self-hosted only, or does
      LangSmith/LangGraph Cloud add proprietary runtime features?
- [ ] How mature is the TypeScript implementation for production use?
- [ ] What observability hooks exist beyond LangSmith integration?

---

## Relevance to Allotey AI Platform

LangGraph represents the most mature graph-based agent runtime in the Python
ecosystem. Its StateGraph model, checkpointing, and interrupt primitives are
worth studying as reference architecture even if we choose a different runtime.
The MIT license is favorable. The tight coupling to the LangChain ecosystem
(tools, prompts, retrievers) is both a strength and a potential lock-in concern.

---

*Last updated: 2026-08-13*
*STATUS: NOT STARTED — notes from initial web research only*
